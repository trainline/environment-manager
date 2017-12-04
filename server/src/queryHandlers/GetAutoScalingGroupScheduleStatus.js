/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let scheduling = require('../modules/scheduling');
let cronService = require('../modules/cronService')();
let sender = require('../modules/sender');
let GetAutoScalingGroup = require('./GetAutoScalingGroup');
let GetAutoScalingGroupScheduledActions = require('./GetAutoScalingGroupScheduledActions');
let GetEnvironmentScheduleStatus = require('./GetEnvironmentScheduleStatus');

function getAutoScalingGroup(query) {
  let childQuery = {
    name: 'GetAutoScalingGroup',
    accountName: query.accountName,
    autoScalingGroupName: query.autoScalingGroupName
  };
  return sender.sendQuery(GetAutoScalingGroup, { query: childQuery });
}

function getAutoScalingGroupScheduledActions(query) {
  let childQuery = {
    name: 'GetAutoScalingGroupScheduledActions',
    accountName: query.accountName,
    autoScalingGroupName: query.autoScalingGroupName
  };
  return sender.sendQuery(GetAutoScalingGroupScheduledActions, { query: childQuery });
}

function maybeGetEnvironmentDefaultSchedule(schedule, query) {
  if (schedule) {
    return Promise.resolve({
      status: scheduling.expectedStateFromSchedule(schedule, query.date).toUpperCase()
    });
  }
  let childQuery = {
    name: 'GetEnvironmentScheduleStatus',
    environmentName: getEnvironment(query.autoScalingGroupName),
    date: query.date
  };
  return sender.sendQuery(GetEnvironmentScheduleStatus, { query: childQuery });
}

function getEnvironment(asgName) {
  let r = /^(.*?)-/;
  let match = r.exec(asgName);

  return match[1];
}

function handler(query) {
  return Promise.all([
    getAutoScalingGroup(query),
    getAutoScalingGroupScheduledActions(query)
  ]).then((results) => {
    let asg = results[0];
    let scheduledActions = results[1];

    if (scheduledActions.length) {
      return {
        status: 'ON',
        size: cronService.getSizeBySchedule(scheduledActions, query.date) // Todo(Dave): Last cronService usage!
      };
    }

    let scheduleTags = asg.Tags.filter(tag => tag.Key === 'Schedule');
    let asgSchedule = scheduleTags && scheduleTags.length > 0 ? scheduleTags[0].Value : null;
    return maybeGetEnvironmentDefaultSchedule(asgSchedule, query);
  });
}

module.exports = handler;
