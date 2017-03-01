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

function actionForInstance(instance, dateTime) {
  if (!instance.Environment) {
    return skip(skipReasons.noEnvironment);
  }

  if (isInMaintenanceMode(instance)) {
    return skip(skipReasons.maintenanceMode);
  }

  let foundSchedule = getScheduleForInstance(instance);

  let source = foundSchedule.source;
  let parseResult = foundSchedule.parseResult;

  if (!parseResult.success) {
    return skip(`${skipReasons.invalidSchedule} - Error: '${parseResult.error}'`, source);
  }

  let schedule = parseResult.schedule;

  if (schedule.skip) {
    return skip(skipReasons.explicitNoSchedule, source);
  }

  let localTime = convertToLocalTime(dateTime, parseResult.timezone);
  let expectedState = expectedStateFromParsedSchedule(schedule, localTime);

  if (expectedState.noSchedule) {
    return skip(skipReasons.stateIsCorrect);
  }

  if (expectedState === states.on) {
    return switchOn(instance, source);
  }

  return switchOff(instance, source);
}

function expectedStateFromSchedule(schedule, dateTime) {
  let parsedSchedule =
    isEnvironmentSchedule(schedule) ?
      parseEnvironmentSchedule(schedule) :
      parseSchedule(schedule);

  if (!parsedSchedule.success) {
    throw parsedSchedule.error;
  }

  if (parsedSchedule.schedule.skip) {
    throw new Error('Cannot get state with NOSCHEDULE');
  }

  let localTime = convertToLocalTime(dateTime, parsedSchedule.timezone);
  let expectedState = expectedStateFromParsedSchedule(parsedSchedule.schedule, localTime);

  if (expectedState.noSchedule) {
    throw new Error('Could not find state from schedule');
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
  if (environmentSchedule.ManualScheduleUp === false && environmentSchedule.ScheduleAutomatically === false) {
    return { success: true, schedule: { permanent: states.off } };
  }

  if (!(environmentSchedule.ManualScheduleUp !== true && environmentSchedule.ScheduleAutomatically === true)) {
    return { success: true, schedule: { permanent: states.on } };
  }

  return parseSchedule(environmentSchedule.DefaultSchedule);
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

function takeAction(action, source) {
  return { action, source };
}

module.exports = {
  actions,
  sources,
  skipReasons,
  states,
  actionForInstance,
  expectedStateFromSchedule
};
