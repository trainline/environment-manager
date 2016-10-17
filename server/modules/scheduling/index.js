'use strict'

const _ = require('lodash');
const parseSchedule = require('./parseSchedule');
const later = require('later');

const actions = {
  switchOn: "switchOn",
  switchOff: "switchOff",
  skip: "skip"
};

const sources = {
  instance: "instance",
  environment: "environment"
};

const skipReasons = {
  noEnvironment: "This instance has no environment",
  noScheduleTag: "There is no schedule tag for this instance",
  explicitNoSchedule: "The schedule tag for this instance is set to 'noschedule'",
  invalidSchedule: "The schedule tag for this instance is not valid",
  transitioning: "This instance is currently transitioning between states",
  stateIsCorrect: "The instance is already in the correct state"
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

  let scheduleTag = getInstanceOrASGScheduleTagValue(instance);

  if (!scheduleTag)
    return actionForEnvironment(currentState, instance.Environment, dateTime);

  return actionForSchedule(currentState, scheduleTag, dateTime);

}

function actionForSchedule(currentState, scheduleTag, dateTime) {

  let parseResult = parseSchedule(scheduleTag.value);

  if (!parseResult.success)
    return skip(`${skipReasons.invalidSchedule} - Value: '${scheduleTag.value}', Error: '${parseResult.error}'`, scheduleTag.source);

  let schedule = parseResult.schedule;

  if (schedule.skip)
    return skip(skipReasons.explicitNoSchedule, scheduleTag.source);

  return actionFromState(currentState, schedule, dateTime, scheduleTag.source);

}

function getInstanceOrASGScheduleTagValue(instance) {

  let instanceScheduleTagValue = getInstanceTagValue(instance, 'schedule');
  if (instanceScheduleTagValue) return { value: instanceScheduleTagValue, source: sources.instance };

  if (instance.AutoScalingGroup) {
    let asgScheduleTagValue = getInstanceTagValue(instance.AutoScalingGroup, 'schedule');
    if (asgScheduleTagValue) return { value: asgScheduleTagValue, source: sources.asg };
  }

}

function actionForEnvironment(currentState, environment, dateTime) {

  let parseResult = parseEnvironmentSchedule(environment);

  if (!parseResult.success)
    return skip(`${skipReasons.invalidSchedule} - Value: '${environment.DefaultSchedule}', Error: '${parseResult.error}'`, sources.environment);

  return actionFromState(currentState, parseResult.schedule, dateTime, sources.environment);

}

function parseEnvironmentSchedule(environment) {

  if (environment.ManualScheduleUp === false && environment.ScheduleAutomatically === false)
    return { success: true, schedule: { permanent: 'off' } };
  
  if (!(environment.ManualScheduleUp !== true && environment.ScheduleAutomatically === true))
    return { success: true, schedule: { permanent: 'on' } };
  
  return parseSchedule(environment.DefaultSchedule);

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

function actionFromState(currentState, schedule, dateTime, source) {

  let expectedState = expectedStateFromSchedule(schedule, dateTime);

  if (currentState === expectedState)
    return skip(skipReasons.stateIsCorrect, source);

  if (expectedState === states.on)
    return takeAction(actions.switchOn, source);

  return takeAction(actions.switchOff, source);

}

function getInstanceTagValue(instance, tagName) {
  let tag = _.first(instance.Tags.filter(tag => tag.Key.toLowerCase() == tagName.toLowerCase()));
  if (tag && tag.Value)
    return tag.Value.trim();
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