/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const _ = require('lodash');
const parseSchedule = require('./parseSchedule');
const later = require('later');
const moment = require('moment-timezone');

const actions = {
  switchOn: 'switchOn',
  switchOff: 'switchOff',
  putInService: 'putInService',
  putOutOfService: 'putOutOfService',
  skip: 'skip'
};

const sources = {
  instance: 'instance',
  asg: 'asg',
  environment: 'environment'
};

const skipReasons = {
  noEnvironment: 'This instance has no environment',
  explicitNoSchedule: 'The schedule tag for this instance is set to "noschedule"',
  invalidSchedule: 'The schedule tag for this instance is not valid',
  transitioning: 'This instance is currently transitioning between states',
  asgTransitioning: 'This instance is currently transitioning between ASG lifecycle states',
  asgLifecycleMismatches: 'The ASG has instances in different lifecycle states',
  maintenanceMode: 'This instance is currently in Maintenance Mode',
  stateIsCorrect: 'The instance is already in the correct state'
};

const states = {
  on: 'on',
  off: 'off'
};

const lifeCycleStates = {
  inService: 'InService',
  outOfService: 'Standby'
};

const currentStates = {
  on: 'on',
  off: 'off',
  transitioning: 'transitioning'
};

function actionsForAutoScalingGroup(autoScalingGroup, instances, dateTime) {

  autoScalingGroup.Environment = getTagValue(autoScalingGroup, 'Environment');

  mergeAsgInstances(autoScalingGroup, instances);

  if (!autoScalingGroup.Environment) {
    return skipAll(autoScalingGroup, skipReasons.noEnvironment);
  }

  let foundSchedule = getScheduleForInstance(autoScalingGroup);

  let source = foundSchedule.source;
  let parseResult = foundSchedule.parseResult;

  if (!parseResult.success) {
    return skipAll(autoScalingGroup, `${skipReasons.invalidSchedule} - Error: '${parseResult.error}'`, source);
  }

  let schedule = parseResult.schedule;

  if (schedule.skip) {

    // TODO: Check for any instances that might have schedules, this should fallback on to actionForInstance

    return skipAll(autoScalingGroup, skipReasons.explicitNoSchedule);
  }

  let localTime = convertToLocalTime(dateTime, parseResult.timezone);
  let expectedState = expectedStateFromParsedSchedule(schedule, localTime);

  if (expectedState.noSchedule) {
    return skipAll(autoScalingGroup, skipReasons.stateIsCorrect);
  }

  var expectedNumberOfServers = 0;

  if (expectedState === states.on) {
    expectedNumberOfServers = autoScalingGroup.MaxSize;
  } else if (expectedState === states.off) {
    expectedNumberOfServers = autoScalingGroup.MinSize;
  } else {
    expectedNumberOfServers = Number(expectedState);
  }

  var actions = [];
  
  if (expectedNumberOfServers < calculateNumberOfServersRunning(autoScalingGroup)) {
    var numberOfServersToSwitchOff = calculateNumberOfServersRunning(autoScalingGroup) - expectedNumberOfServers
    actions = [...switchOffAsg(numberOfServersToSwitchOff, autoScalingGroup)];
  } else if (expectedNumberOfServers > calculateNumberOfServersInService(autoScalingGroup)) {
    var numberOfServersToSwitchOn = expectedNumberOfServers - calculateNumberOfServersInService(autoScalingGroup);
    actions = [...switchOnAsg(numberOfServersToSwitchOn, autoScalingGroup)];
  }

  return actions;
}

function calculateNumberOfServersRunning(autoScalingGroup) {
  var distributionSet = getAsgDistributionSet(autoScalingGroup);
  var numberOfServersRunning = findInstancesWhere(distributionSet, autoScalingGroup.Instances.length, (instance) => currentStateOfInstance(instance._instance) == currentStates.on);
  return numberOfServersRunning.length;
}

function calculateNumberOfServersInService(autoScalingGroup) {
  var distributionSet = getAsgDistributionSet(autoScalingGroup);
  var numberOfServersInService = findInstancesWhere(distributionSet, autoScalingGroup.Instances.length, (instance) => instance.LifecycleState == lifeCycleStates.inService);
  return numberOfServersInService.length;
}

function getAsgDistributionSet(autoScalingGroup) {
  var results = {};
  autoScalingGroup.AvailabilityZones.sort()
  for (var availabilityZone of autoScalingGroup.AvailabilityZones) {
    results[availabilityZone] = [];
  }
  for (var instance of autoScalingGroup.Instances) {
    results[instance.AvailabilityZone].push(instance);
    results[instance.AvailabilityZone].sort((a, b) => {
      if (a.InstanceId > b.InstanceId) return 1;
      if (a.InstanceId < b.InstanceId) return -1;
      if (a.InstanceId === b.InstanceId) return 0;
    });
  }
  return results;
}

function findInstancesWhere(distributionSet, numberOfServers, instancePredicate) {
  var instancesFound = [];
  for (var availabilityZone of Object.keys(distributionSet)) {
    for (var instance of distributionSet[availabilityZone]) {
      if (instancePredicate(instance) && instancesFound.length !== numberOfServers)
        instancesFound.push(instance);
    }
  }
  return instancesFound;
}

function switchOffAsg(numberOfServersToSwitchOff, autoScalingGroup) {

  var distributionSet = getAsgDistributionSet(autoScalingGroup);

  var actions = [];

  var outOfServiceButRunningInstances = findInstancesWhere(distributionSet, numberOfServersToSwitchOff, (instance) => 
    instance.LifecycleState == lifeCycleStates.outOfService && currentStateOfInstance(instance._instance) == currentStates.on);
  
  var inServiceInstances = findInstancesWhere(distributionSet, numberOfServersToSwitchOff - outOfServiceButRunningInstances.length, (instance) => 
    instance.LifecycleState == lifeCycleStates.inService);
  
  for (var instance of [...outOfServiceButRunningInstances, ...inServiceInstances]) {
    var action = switchOff(instance._instance);
    action.instance = getInstanceInfo(instance._instance);
    actions.push(action);
  }

  return actions;
}

function switchOnAsg(numberOfServersToSwitchOn, autoScalingGroup) {
  var distributionSet = getAsgDistributionSet(autoScalingGroup);

  var actions = [];

  var inServiceInstances = findInstancesWhere(distributionSet, numberOfServersToSwitchOn, (instance) => 
    instance.LifecycleState == lifeCycleStates.outOfService && currentStateOfInstance(instance._instance) == currentStates.on);
  
  var outOfServiceAndSwitchedOffInstances = findInstancesWhere(distributionSet, numberOfServersToSwitchOn - inServiceInstances.length, (instance) => 
    instance.LifecycleState == lifeCycleStates.outOfService && currentStateOfInstance(instance._instance) == currentStates.off);

  for (var instance of [...inServiceInstances, ...outOfServiceAndSwitchedOffInstances]) {
    var action = switchOn(instance._instance);
    action.instance = getInstanceInfo(instance._instance);
    actions.push(action);
  }

  return actions;

}

function mergeAsgInstances(autoScalingGroup, instances) {
  for (var instanceIndex in autoScalingGroup.Instances) {
    var currentInstance = autoScalingGroup.Instances[instanceIndex];
    var emInstance = instances.filter(x => x.InstanceId === currentInstance.InstanceId)[0];
    currentInstance._instance = emInstance;
  }
}

function actionForInstance(instance, dateTime) {

  if (!instance.Environment) {
    var action = skip(skipReasons.noEnvironment);
    action.instance = getInstanceInfo(instance);
    return action;
  }

  if (isInMaintenanceMode(instance)) {
    var action = skip(skipReasons.maintenanceMode);
    action.instance = getInstanceInfo(instance);
    return action;
  }

  let foundSchedule = getScheduleForInstance(instance);

  let source = foundSchedule.source;
  let parseResult = foundSchedule.parseResult;

  if (!parseResult.success) {
    var action = skip(`${skipReasons.invalidSchedule} - Error: '${parseResult.error}'`, source);
    action.instance = getInstanceInfo(instance);
    return action;
  }

  let schedule = parseResult.schedule;

  if (schedule.skip) {
    var action = skip(skipReasons.explicitNoSchedule, source);
    action.instance = getInstanceInfo(instance);
    return action;
  }

  let localTime = convertToLocalTime(dateTime, parseResult.timezone);
  let expectedState = expectedStateFromParsedSchedule(schedule, localTime);

  if (expectedState.noSchedule) {
    var action = skip(skipReasons.stateIsCorrect);
    action.instance = getInstanceInfo(instance);
    return action;
  }

  if (expectedState === states.on) {
    var action = switchOn(instance, source);
    action.instance = getInstanceInfo(instance);
    return action;
  }

  var action = switchOff(instance, source);
  action.instance = getInstanceInfo(instance);
  return action;
}

function expectedStateFromSchedule(schedule, dateTime) {
  let parsedSchedule =
    isEnvironmentSchedule(schedule) ?
      parseEnvironmentSchedule(schedule) :
      parseSchedule(schedule);

  if (!parsedSchedule.success) {
    return 'INVALID SCHEDULE';
  }

  if (parsedSchedule.schedule.skip) {
    return 'NO SCHEDULE';
  }

  let localTime = convertToLocalTime(dateTime, parsedSchedule.timezone);
  let expectedState = expectedStateFromParsedSchedule(parsedSchedule.schedule, localTime);

  if (expectedState.noSchedule) {
    return 'NOT FOUND';
  }

  return expectedState;
}

function isEnvironmentSchedule(schedule) {
  let environmentScheduleProperties = ['DefaultSchedule', 'ManualScheduleUp', 'ScheduleAutomatically'];
  return _.some(environmentScheduleProperties, p => schedule[p] !== undefined);
}

function switchOn(instance, source) {
  let currentState = currentStateOfInstance(instance);

  if (currentState === currentStates.off) {
    return takeAction(actions.switchOn, source);
  }

  if (currentState === currentStates.transitioning) { return skip(skipReasons.transitioning); }

  if (instance.AutoScalingGroup) {
    let lifeCycleState = getAsgInstanceLifeCycleState(instance);

    if (lifeCycleState === lifeCycleStates.outOfService) {
      return takeAction(actions.putInService, source);
    }

    if (lifeCycleState === lifeCycleStates.transitioning) {
      return skip(skipReasons.asgTransitioning);
    }
  }

  return skip(skipReasons.stateIsCorrect, source);
}

function switchOff(instance, source) {
  if (instance.AutoScalingGroup) {
    let lifeCycleState = getAsgInstanceLifeCycleState(instance);

    if (lifeCycleState === lifeCycleStates.inService) {
      return takeAction(actions.putOutOfService, source);
    }

    if (lifeCycleState === lifeCycleStates.transitioning) {
      return skip(skipReasons.asgTransitioning);
    }
  }

  let currentState = currentStateOfInstance(instance);

  if (currentState === currentStates.on) {
    return takeAction(actions.switchOff, source);
  }

  if (currentState === currentStates.transitioning) {
    return skip(skipReasons.transitioning);
  }

  return skip(skipReasons.stateIsCorrect, source);
}

function isInMaintenanceMode(instance) {
  let maintenanceModeTagValue = getTagValue(instance, 'maintenance');
  return maintenanceModeTagValue && maintenanceModeTagValue.toLowerCase() === 'true';
}

function getAsgInstanceLifeCycleState(instance) {
  let asgInstanceEntry = _.first(instance.AutoScalingGroup.Instances.filter(i => i.InstanceId.toLowerCase() === instance.InstanceId.toLowerCase()));

  if (asgInstanceEntry) {
    if (asgInstanceEntry.LifecycleState === 'Standby') return lifeCycleStates.outOfService;
    if (asgInstanceEntry.LifecycleState === 'InService') return lifeCycleStates.inService;
  }

  return lifeCycleStates.transitioning;
}

function getScheduleForInstance(instance) {
  let instanceSchedule = getTagValue(instance, 'schedule');
  if (instanceSchedule) return { parseResult: parseSchedule(instanceSchedule), source: sources.instance };

  if (instance.AutoScalingGroup) {
    let asgSchedule = getTagValue(instance.AutoScalingGroup, 'schedule');
    if (asgSchedule) return { parseResult: parseSchedule(asgSchedule), source: sources.asg };
  }

  return { parseResult: parseEnvironmentSchedule(instance.Environment), source: sources.environment };
}

function parseEnvironmentSchedule(environmentSchedule) {
  if (environmentIsScheduledOff(environmentSchedule)) {
    return { success: true, schedule: { permanent: states.off } };
  }

  if (environmentIsScheduledOn(environmentSchedule)) {
    return { success: true, schedule: { permanent: states.on } };
  }

  return parseSchedule(environmentSchedule.DefaultSchedule);
}

function environmentIsScheduledOff(schedule) {
  return schedule.ManualScheduleUp === false && schedule.ScheduleAutomatically === false;
}

function environmentIsScheduledOn(schedule) {
  return !(schedule.ManualScheduleUp !== true && schedule.ScheduleAutomatically === true);
}

function expectedStateFromParsedSchedule(schedules, dateTime) {
  if (schedules.permanent) {
    return schedules.permanent;
  }

  let scheduleStates = schedules.map((schedule) => {
    return {
      dateTime: later.schedule(schedule.recurrence).prev(1, dateTime),
      state: schedule.state
    };
  });

  let latest = _.maxBy(scheduleStates, scheduleState => scheduleState.dateTime);

  if (latest.dateTime === 0) { return { noSchedule: true }; }

  return latest.state;
}

function convertToLocalTime(dateTime, timezone) {
  return moment.tz(dateTime, 'utc').tz(timezone || 'utc').format('YYYY-MM-DDTHH:mm:ss');
}

function getTagValue(instance, tagName) {
  if (instance.Tags) {
    let tag = _.first(instance.Tags.filter(t => t.Key.toLowerCase() === tagName.toLowerCase()));
    return (tag && tag.Value) ? tag.Value.trim() : undefined;
  }
  return undefined;
}

function currentStateOfInstance(instance) {
  if (instance.State.Name === 'running') return currentStates.on;
  if (instance.State.Name === 'stopped') return currentStates.off;

  return currentStates.transitioning;
}

function skip(reason, source) {
  return { action: actions.skip, reason, source };
}

function skipAll(autoScalingGroup, reason, source) {
  var actions = [];
  for (var instanceIndex in autoScalingGroup.Instances) {
    var currentInstance = autoScalingGroup.Instances[instanceIndex];
    var action = skip(reason, source);
    action.instance = getInstanceInfo(currentInstance);
    actions.push(action);
  }
  return actions;
}

function takeAction(action, source) {
  return { action, source };
}

function getInstanceInfo(instance) {
  let instanceVM = {
    id: instance.InstanceId,
    name: getTagValue(instance, 'name'),
    role: getTagValue(instance, 'role'),
    environment: getTagValue(instance, 'environment')
  };
  if (instance.AutoScalingGroup) {
    instanceVM.asg = instance.AutoScalingGroup.AutoScalingGroupName;
  }
  return instanceVM;
}

module.exports = {
  actions,
  sources,
  skipReasons,
  states,
  actionForInstance,
  actionsForAutoScalingGroup,
  expectedStateFromSchedule
};
