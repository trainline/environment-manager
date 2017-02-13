'use strict';

let parseSchedule = require('./parseSchedule');
let sources = require('./sources');

function parseEnvironmentSchedule(environmentSchedule) {
  if (environmentSchedule.ManualScheduleUp === false && environmentSchedule.ScheduleAutomatically === false) {
    return { success: true, schedule: { permanent: 'off' } };
  }

  if (!(environmentSchedule.ManualScheduleUp !== true && environmentSchedule.ScheduleAutomatically === true)) {
    return { success: true, schedule: { permanent: 'on' } };
  }

  return parseSchedule(environmentSchedule.DefaultSchedule);
}

module.exports = function getSchedulebyEnvironment(environment) {
  return { parseResult: parseEnvironmentSchedule(environment), source: sources.environment };
};
