/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let moment = require('moment');
let cronService = require('modules/cronService')();
let config = require('config');

function getEnvironmentDetails(query) {
  const masterAccountName = config.getUserValue('masterAccountName');
  
  var sender = require('modules/sender');
  var childQuery = {
    name: 'GetDynamoResource',
    resource: 'ops/environments',
    key: query.environmentName,
    accountName: masterAccountName,
  };

  return sender.sendQuery({ query: childQuery });
}

function getSchedule(env, date) {
  if (env.ScheduleAutomatically) {
    var schedule = cronService.getActionBySchedule(env.DefaultSchedule, date);
    return schedule ? schedule : 'ON';
  }

  return env.ManualScheduleUp ? 'ON' : 'OFF';
}

function handler(query) {
  return getEnvironmentDetails(query).then(environmentDetails => {
    var schedule = getSchedule(environmentDetails.Value, moment(query.date).toDate());
    return { status: schedule };
  });
};

module.exports = handler;
