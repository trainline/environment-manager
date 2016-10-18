'use strict'

const _ = require('lodash');
const parseSchedule = require('./parseSchedule');
const later = require('later');

const actions = {
  switchOn: "switchOn",
  switchOff: "switchOff",
  putInService: "putInService",
  putOutOfService: "putOutOfService",
  skip: "skip"
};

const sources = {
  instance: "instance",
  asg: "asg",
  environment: "environment"
};

const skipReasons = {
  noEnvironment: "This instance has no environment",
  noScheduleTag: "There is no schedule tag for this instance",
  explicitNoSchedule: "The schedule tag for this instance is set to 'noschedule'",
  invalidSchedule: "The schedule tag for this instance is not valid",
  transitioning: "This instance is currently transitioning between states",
  asgTransitioning: "This instance is currently transitioning between ASG lifecycle states",
  stateIsCorrect: "The instance is already in the correct state"
};

const lifeCycleStates = {
  inService: "InService",
  outOfService: "Standby"
};

const states = {
  on: "on",
  off: "off",
  transitioning: "transitioning"
};

function actionForInstance(instance, dateTime) {

  let currentState = currentStateOfInstance(instance);
  if (currentState === states.transitioning)
    return skip(skipReasons.transitioning);

  if (!instance.Environment)
    return skip(skipReasons.noEnvironment);

  if (instance.AutoScalingGroup) {
    let lifeCycleState = getInstanceLifeCycleState(instance);
    if (lifeCycleState === lifeCycleStates.transitioning)
      return skip(skipReasons.asgTransitioning);
  }

  let foundSchedule = getScheduleForInstance(instance);

  let source = foundSchedule.source;
  let parseResult = foundSchedule.parseResult;

  if (!parseResult.success)
    return skip(`${skipReasons.invalidSchedule} - Error: '${parseResult.error}'`, source);

  let schedule = parseResult.schedule;

  if (schedule.skip)
    return skip(skipReasons.explicitNoSchedule, source);

  let expectedState = expectedStateFromSchedule(schedule, dateTime);

  if (currentState === expectedState)
    return skip(skipReasons.stateIsCorrect, source);

  if (expectedState === states.on)
    return takeAction(switchOnAction(instance), source);

  return takeAction(switchOffAction(instance), source);

}

function switchOnAction(instance) {
  if (instance.AutoScalingGroup) {
    let lifeCycleStatus = getInstanceLifeCycleState(instance);
    if (lifeCycleStatus === lifeCycleStates.outOfService)
      return actions.putInService;
  }
  return actions.switchOn;
}

function switchOffAction(instance) {
  if (instance.AutoScalingGroup) {
    let lifeCycleStatus = getInstanceLifeCycleState(instance);
    if (lifeCycleStatus === lifeCycleStates.inService)
      return actions.putOutOfService;
  }
  return actions.switchOff;
}

function getInstanceLifeCycleState(instance) {
  let asgInstanceEntry = _.first(instance.AutoScalingGroup.Instances.filter(i => i.InstanceId.toLowerCase() == instance.InstanceId.toLowerCase()));
  
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

  if (environmentSchedule.ManualScheduleUp === false && environmentSchedule.ScheduleAutomatically === false)
    return { success: true, schedule: { permanent: 'off' } };
  
  if (!(environmentSchedule.ManualScheduleUp !== true && environmentSchedule.ScheduleAutomatically === true))
    return { success: true, schedule: { permanent: 'on' } };
  
  return parseSchedule(environmentSchedule.DefaultSchedule);

}

function expectedStateFromSchedule(schedule, dateTime) {
  if (schedule.permanent)
    return schedule.permanent;

  let scheduleStates = schedule.map(schedule => {
    return {
      dateTime: later.schedule(schedule.recurrence).prev(1, dateTime),
      state: schedule.state
    };
  });

  let latest = _.maxBy(scheduleStates, scheduleState => scheduleState.dateTime);

  return latest.state;
}

function getTagValue(instance, tagName) {
  if (instance.Tags) {
    let tag = _.first(instance.Tags.filter(tag => tag.Key.toLowerCase() == tagName.toLowerCase()));
    if (tag && tag.Value)
      return tag.Value.trim();
  }
}

function currentStateOfInstance(instance) {
  if (instance.State.Name === 'running') return states.on;
  if (instance.State.Name === 'stopped') return states.off;
  
  return states.transitioning;
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
  actionForInstance
};