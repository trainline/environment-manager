'use strict';

let _ = require('lodash');
let later = require('later');

function fromSingleEnvironmentSchedule(schedule) {
  return _.get(schedule, 'permanent', null);
}

function fromMultipleEnvironmentSchedules(schedules, dateTime) {
  if (!schedules || !Array.isArray(schedules)) {
    return null;
  }

  let result = null;

  result = getLatestSchedule(schedules, dateTime);

  return result;
}

function getLatestSchedule(schedules, date = new Date()) {
  let scheduleStates = schedules.map((schedule) => {
    if (schedule.recurrence && schedule.state) {
      return {
        dateTime: later.schedule(schedule.recurrence).prev(1, date),
        state: schedule.state
      };
    } else {
      return {
        dateTime: null,
        state: null
      };
    }
  });

  if (!scheduleStates) {
    return null;
  }

  let latest = _.maxBy(scheduleStates, scheduleState => scheduleState.dateTime);

  if (!latest) {
    return null;
  }

  return latest.state;
}

module.exports = {
  fromSingleEnvironmentSchedule,
  fromMultipleEnvironmentSchedules
};
