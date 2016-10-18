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
      instances: details.actionGroups.switchOn.map(viewableActionGroup)
    },
    switchOff: {
      result: details.changeResults.switchOff,
      instances: details.actionGroups.switchOff.map(viewableActionGroup)
    }
  }

  if (listSkippedInstances)
    result.skippedInstances = details.actionGroups.skip.map(viewableActionGroup);

  return result;
}

function viewableActionGroup(actionGroup) {

  let instance = actionGroup.instance;
  let action = actionGroup.action;

  return {
    instance:{
      id: instance.InstanceId,
      name: getInstanceTagValue(instance, 'Name'),
      role: getInstanceTagValue(instance, 'Role')
    },
    reason: action.reason,
    source: action.source
  };
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