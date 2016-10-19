'use strict'

const _ = require('lodash');

function createReport(details, listSkippedInstances) {

  let success =
    details.changeResults.switchOff.success &&
    details.changeResults.switchOn.success;

  let result = {
    success: success,
    switchOn: {
      result: details.changeResults.switchOn,
      instances: details.actionGroups.switchOn
    },
    switchOff: {
      result: details.changeResults.switchOff,
      instances: details.actionGroups.switchOff
    }
  }

  if (listSkippedInstances)
    result.skippedInstances = details.actionGroups.skip;

  return result;
}

function getInstanceTagValue(instance, tagName) {
  if (instance.Tags) {
    let tag = _.first(instance.Tags.filter(tag => tag.Key.toLowerCase() == tagName.toLowerCase()));
    if (tag) return tag.Value;
  }
}

module.exports = {
  createReport
}