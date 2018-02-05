/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let later = require('later');

const cronActions = {
  start: 'on',
  stop: 'off'
};

function tryParseSchedule(serialisedSchedule) {
  try {
    return parseSchedule(serialisedSchedule);
  } catch (err) {
    return invalid(err);
  }
}

function parseSchedule(serialisedSchedule) {
  let schedule = serialisedSchedule.trim().toLowerCase();

  if (schedule === 'noschedule') { return skip(); }

  if (['on', '247', 'off'].some(x => x === schedule)) {
    return permanent(schedule);
  }

  let parseResult = tryParseCronSchedule(schedule);

  if (!parseResult.success) {
    return invalid(`Could not parse cron schedule - Error: '${parseResult.error}'`);
  }

  return parseResult;
}

function tryParseCronSchedule(serialisedCronSchedule) {
  try {
    return parseCronSchedule(serialisedCronSchedule);
  } catch (err) {
    return { success: false, error: err };
  }
}

function parseCronSchedule(serialisedCronSchedule) {
  let [serializedSchedule, timezone] = serialisedCronSchedule.split('|');
  if (timezone) timezone = timezone.trim();

  let schedule = serializedSchedule.split(';').map((item) => {
    let parts = item.split(':');
    let state = cronActions[parts[0].trim()];

    if (state === undefined) {
      throw new Error('Invalid cron action');
    }

    let recurrence = later.parse.cron(parts[1].trim());
    return { state, recurrence };
  });

  return {
    success: true,
    schedule,
    timezone
  };
}

function permanent(schedule) {
  let state = schedule === 'off' ? 'off' : 'on';
  return { success: true, schedule: { permanent: state } };
}

function invalid(err) {
  return { success: false, error: err };
}

function skip() {
  return { success: true, schedule: { skip: true } };
}

module.exports = tryParseSchedule;
