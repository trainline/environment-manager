/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/* eslint-disable */

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

  if (autoScalingGroup.AutoScalingGroupName !== 'c50-in-RansomTestAppLinux-blue') return [];

  autoScalingGroup.Environment = getTagValue(autoScalingGroup, 'Environment');

  mergeAsgInstances(autoScalingGroup, instances);

  if (!autoScalingGroup.Environment) {
    return skipAll(autoScalingGroup, skipReasons.noEnvironment);
  }

  if (autoScalingGroup.Instances.some(i => currentStateOfInstance(i._instance) == currentStates.transitioning))
    return skipAll(autoScalingGroup, skipReasons.transitioning);

  let foundSchedule = getScheduleFromTag(autoScalingGroup);

  if (!foundSchedule.parseResult.success) {
    return skipAll(autoScalingGroup, `${skipReasons.invalidSchedule} - Error: '${foundSchedule.parseResult.error}'`, source);
  }

  if (foundSchedule.parseResult.schedule.skip) {
    return skipAll(autoScalingGroup, skipReasons.explicitNoSchedule);
  }

  let localTime = convertToTimezone(dateTime, foundSchedule.parseResult.timezone);
  let expectedState = expectedStateFromParsedSchedule(foundSchedule.parseResult.schedule, localTime);

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

  let actualNumberOfServersRunning = calculateNumberOfServersRunning(autoScalingGroup);
  let actualNumberOfServersInService = calculateNumberOfServersInService(autoScalingGroup);

  if (expectedNumberOfServers < actualNumberOfServersRunning) {
    var numberOfServersToSwitchOff = actualNumberOfServersRunning - expectedNumberOfServers
    return [...switchOffAsg(numberOfServersToSwitchOff, autoScalingGroup)];
  } else if (expectedNumberOfServers > actualNumberOfServersInService) {
    var numberOfServersToSwitchOn = expectedNumberOfServers - actualNumberOfServersInService;
    return [...switchOnAsg(numberOfServersToSwitchOn, autoScalingGroup)];
  } else {
    return skipAll(autoScalingGroup, skipReasons.stateIsCorrect);
  }
}

function calculateNumberOfServersRunning(autoScalingGroup) {
  var distributionSet = buildDistributionSet(autoScalingGroup.Instances);
  var numberOfServersRunning = findInstancesWhere(distributionSet, autoScalingGroup.Instances.length, (instance) => currentStateOfInstance(instance._instance) == currentStates.on);
  return numberOfServersRunning.length;
}

function calculateNumberOfServersInService(autoScalingGroup) {
  var distributionSet = buildDistributionSet(autoScalingGroup.Instances);
  var numberOfServersInService = findInstancesWhere(distributionSet, autoScalingGroup.Instances.length, (instance) => instance.LifecycleState == lifeCycleStates.inService);
  return numberOfServersInService.length;
}

function findInstancesWhere(distributionSet, numberOfServers, instancePredicate) {
  var instancesFound = [];
  for (let availabilityZone of Object.keys(distributionSet)) {
    for (var instance of distributionSet[availabilityZone]) {
      if (instancePredicate(instance) && instancesFound.length !== numberOfServers)
        instancesFound.push(instance);
    }
  }
  return instancesFound;
}

function buildDistributionSet(instances) {
  var distributionSet = {};
  for (var instance of instances) {
    distributionSet[instance.AvailabilityZone] = [];
  }
  for (var instance of instances) {
    distributionSet[instance.AvailabilityZone].push(instance);
  }
  return distributionSet;
}

function findInstancesToSwitchOff(totalNumberOfInstances, autoScalingGroup, foundInstances, instancePredicate) {
  if (totalNumberOfInstances === 0) return foundInstances;
  var distributionSet = buildDistributionSet(autoScalingGroup.Instances);
  var remainingInstances = findInstancesWhere(distributionSet, autoScalingGroup.Instances.length, (x) => !foundInstances.some(y => y.InstanceId === x.InstanceId) && instancePredicate(x));
  if (remainingInstances.length === 0)
    return foundInstances;

  var remainingDistributionSet = buildDistributionSet(remainingInstances);

  var currentAvailabilityZoneLength = -1;
  var availabilityZoneWithMaxInstances = '';
  for (var availabilityZone of Object.keys(remainingDistributionSet)) {
    if (remainingDistributionSet[availabilityZone].length > currentAvailabilityZoneLength) {
      availabilityZoneWithMaxInstances = availabilityZone;
      currentAvailabilityZoneLength = remainingDistributionSet[availabilityZone].length;
    }
  }

  var instanceSelectedForRemoval = remainingDistributionSet[availabilityZoneWithMaxInstances][0]
  foundInstances.push(instanceSelectedForRemoval);
  if (foundInstances.length == totalNumberOfInstances)
    return foundInstances;

  return findInstancesToSwitchOff(totalNumberOfInstances, autoScalingGroup, foundInstances, instancePredicate);
}

function findInstancesToSwitchOn(totalNumberOfInstances, autoScalingGroup, foundInstances, instancePredicate) {
  if (totalNumberOfInstances === 0) return foundInstances;
  var distributionSet = buildDistributionSet(autoScalingGroup.Instances);
  var remainingInstances = findInstancesWhere(distributionSet, autoScalingGroup.Instances.length, (x) => !foundInstances.some(y => y.InstanceId === x.InstanceId) && instancePredicate(x));
  if (remainingInstances.length === 0)
    return foundInstances;

  var remainingDistributionSet = buildDistributionSet(remainingInstances);

  var currentAvailabilityZoneLength = 999;
  var availabilityZoneWithMinInstances = '';
  for (var availabilityZone of Object.keys(remainingDistributionSet)) {
    if (remainingDistributionSet[availabilityZone].length < currentAvailabilityZoneLength) {
      availabilityZoneWithMinInstances = availabilityZone;
      currentAvailabilityZoneLength = remainingDistributionSet[availabilityZone].length;
    }
  }

  var instanceSelectedForRemoval = remainingDistributionSet[availabilityZoneWithMinInstances][0]
  foundInstances.push(instanceSelectedForRemoval);
  if (foundInstances.length == totalNumberOfInstances)
    return foundInstances;

  return findInstancesToSwitchOn(totalNumberOfInstances, autoScalingGroup, foundInstances, instancePredicate);
}

function getActionResult(action, instanceInfo) {
  return { action: action, instance: instanceInfo };
}

function switchOffAsg(numberOfServersToSwitchOff, autoScalingGroup) {
  var actions = [];

  var outOfServiceButRunningInstances = findInstancesToSwitchOff(numberOfServersToSwitchOff, autoScalingGroup, [], (instance) =>
    instance.LifecycleState == lifeCycleStates.outOfService && currentStateOfInstance(instance._instance) == currentStates.on);

  var inServiceInstances = findInstancesToSwitchOff(numberOfServersToSwitchOff - outOfServiceButRunningInstances.length, autoScalingGroup, [], (instance) =>
    instance.LifecycleState == lifeCycleStates.inService);

  for (var instance of [...outOfServiceButRunningInstances, ...inServiceInstances]) {
    var action = getActionResult(switchOff(instance._instance), getInstanceInfo(instance._instance));
    actions.push(action);
  }

  return actions;
}

function switchOnAsg(numberOfServersToSwitchOn, autoScalingGroup) {
  var actions = [];

  var outOfServiceButRunningInstances = findInstancesToSwitchOn(numberOfServersToSwitchOn, autoScalingGroup, [], (instance) =>
    instance.LifecycleState == lifeCycleStates.outOfService && currentStateOfInstance(instance._instance) == currentStates.on);

  var outOfServiceAndSwitchedOffInstances = findInstancesToSwitchOn(numberOfServersToSwitchOn - outOfServiceButRunningInstances.length, autoScalingGroup, [], (instance) =>
    instance.LifecycleState == lifeCycleStates.outOfService && currentStateOfInstance(instance._instance) == currentStates.off);

  for (var instance of [...outOfServiceButRunningInstances, ...outOfServiceAndSwitchedOffInstances]) {
    var action = getActionResult(switchOn(instance._instance), getInstanceInfo(instance._instance));
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
    return getActionResult(skip(skipReasons.noEnvironment), getInstanceInfo(instance));
  }

  if (isInMaintenanceMode(instance)) {
    return getActionResult(skip(skipReasons.maintenanceMode), getInstanceInfo(instance));
  }

  let foundSchedule = getScheduleFromTag(instance);

  let source = foundSchedule.source;
  let parseResult = foundSchedule.parseResult;

  if (!parseResult.success) {
    return getActionResult(skip(`${skipReasons.invalidSchedule} - Error: '${parseResult.error}'`, source), getInstanceInfo(instance));
  }

  let schedule = parseResult.schedule;

  if (schedule.skip) {
    return getActionResult(skip(skipReasons.explicitNoSchedule, source), getInstanceInfo(instance));
  }

  let localTime = convertToTimezone(dateTime, parseResult.timezone);
  let expectedState = expectedStateFromParsedSchedule(schedule, localTime);

  if (expectedState.noSchedule) {
    return getActionResult(skip(skipReasons.stateIsCorrect), getInstanceInfo(instance));
  }

  if (expectedState === states.on) {
    return getActionResult(switchOn(instance, source), getInstanceInfo(instance));
  }

  return getActionResult(switchOff(instance, source), getInstanceInfo(instance));
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

  let localTime = convertToTimezone(dateTime, parsedSchedule.timezone);
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

function getScheduleFromTag(instance) {
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

function convertToTimezone(dateTime, timezone) {
  let matchingZoneTime = moment.tz(dateTime, 'utc').tz(timezone || 'utc').format('YYYY-MM-DDTHH:mm:ss');
  return `${matchingZoneTime}Z`;
}

function getTagValue(instance, tagName) {
  if (instance.Tags) {
    let tag = _.first(instance.Tags.filter(t => t.Key.toLowerCase() === tagName.toLowerCase()));
    return (tag && tag.Value) ? tag.Value.trim() : undefined;
  }
  return undefined;
}

function currentStateOfInstance(instance) {
  if (!instance || !instance.State) return currentStates.transitioning;
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

    var result = { action: skip(reason, source), instance: getInstanceInfo(currentInstance._instance || currentInstance) };
    actions.push(result);
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
