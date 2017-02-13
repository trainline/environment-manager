'use strict';

let parseSchedule = require('./parseSchedule');
let sources = require('./sources');

function parseEnvironmentSchedule(schedule) {
  if (permanentOff(schedule)) {
    return { success: true, schedule: { permanent: 'off' } };
  }

  if (permanentOn(schedule)) {
    return { success: true, schedule: { permanent: 'on' } };
  }

  checkForDefaultSchedule(schedule);

  return parseSchedule(schedule.DefaultSchedule);
}

function permanentOff(schedule) {
  return !isManualScheduleUp(schedule) && !isScheduleAutomatically(schedule);
}

function permanentOn(schedule) {
  return isManualScheduleUp(schedule) && !isScheduleAutomatically(schedule);
}

function isManualScheduleUp(schedule) {
  return schedule.ManualScheduleUp === true;
}

function isScheduleAutomatically(schedule) {
  return schedule.ScheduleAutomatically === true;
}

function checkForDefaultSchedule(schedule) {
  if (!schedule.DefaultSchedule) {
    throw new Error('Could not find default schedule');
  }
}

module.exports = function getSchedulebyEnvironment(environment) {
  return {
    parseResult: parseEnvironmentSchedule(environment),
    source: sources.environment
  };
};
