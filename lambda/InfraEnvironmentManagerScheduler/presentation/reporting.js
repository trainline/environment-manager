/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict'

const _ = require('lodash');

function createReport(details, listSkippedInstances) {

  let success =
    details.changeResults.switchOff.success &&
    details.changeResults.switchOn.success &&
    details.changeResults.putInService.success &&
    details.changeResults.putOutOfService.success;

  let result = {
    success: success,
    switchOn: {
      result: details.changeResults.switchOn,
      instances: details.actionGroups.switchOn
    },
    switchOff: {
      result: details.changeResults.switchOff,
      instances: details.actionGroups.switchOff
    },
    putInService: {
      result: details.changeResults.putInService,
      instances: details.actionGroups.putInService
    },
    putOutOfService: {
      result: details.changeResults.putOutOfService,
      instances: details.actionGroups.putOutOfService
    }
  }

  if (listSkippedInstances)
    result.skip = details.actionGroups.skip;

  return result;
}

function getInstanceTagValue(instance, tagName) {
  if (instance.Tags) {
    let tag = _.first(instance.Tags.filter(tag => tag.Key.toLowerCase() === tagName.toLowerCase()));
    if (tag) return tag.Value;
  }
}

module.exports = {
  createReport
}