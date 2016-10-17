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
  memberOfAsg: "This instance is part of an ASG",
  noScheduleTag: "There is no schedule tag for this instance",
  noScheduleOrEnvironmentTag: "This instance has an empty schedule tag and no environment was found",
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

  let asgTag = getInstanceTag(instance, 'aws:autoscaling:groupName');

  if (asgTag)
    return skip(skipReasons.memberOfAsg);

  let currentState = currentStateOfInstance(instance);

  if (currentState === states.transitioning)
    return skip(skipReasons.transitioning);

  let scheduleTag = getInstanceTag(instance, 'schedule');

  if (!scheduleTag)
    return skip(skipReasons.noScheduleTag);
  
  let scheduleValue = scheduleTag.Value.trim();

  if (!scheduleValue) {
    if (instance.Environment)
      return actionForEnvironment(currentState, instance.Environment, dateTime);

    return skip(skipReasons.noScheduleOrEnvironmentTag);
  }  

  let parseResult = parseSchedule(scheduleValue);

  if (!parseResult.success)
    return skip(`${skipReasons.invalidSchedule} - Value: '${scheduleValue}', Error: '${parseResult.error}'`, sources.instance);

  let schedule = parseResult.schedule;

  if (schedule.skip)
    return skip(skipReasons.explicitNoSchedule, sources.instance);

  return actionFromState(currentState, schedule, dateTime, sources.instance);

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

function getInstanceTag(instance, tagName) {
  return _.first(instance.Tags.filter(tag => tag.Key.toLowerCase() == tagName.toLowerCase()));
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