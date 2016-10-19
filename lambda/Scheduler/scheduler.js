'use strict';

const co = require('co');
const _ = require('lodash');

const awsFactory = require('./services/aws');
const emFactory = require('./services/em');

const scheduling = require('./scheduling');
const reporting = require('./presentation/reporting');

function createScheduler(account, config) {

  let em = emFactory.create(config.em);
  let ec2 = awsFactory.create(config.aws).ec2;

  function doScheduling () {
    return co(function*() {

      let scheduledActions = yield getScheduledActions();
      let actionGroups = groupActionsByType(scheduledActions);

      let changeResults = yield performChanges(actionGroups);

      return reporting.createReport({ actionGroups, changeResults }, config.listSkippedInstances);

    }).catch(err => {

      return {
        success: false,
        error: printableError(err),
      };

    });
  }

  function printableError(err) {
    if (err instanceof Error) {
      return {
        message: err.message,
        stack: err.stack
      };
    }

    return err;
  }

  function getScheduledActions() {
    return em.getScheduledInstanceActions(account);
  }

  function groupActionsByType(instanceActions) {

    let result = {};
    Object.keys(scheduling.actions).forEach(action => result[action] = []);

    instanceActions.forEach(instanceAction => {
      result[instanceAction.action.action].push(instanceAction);
    });

    return result;

  }

  function performChanges(actionGroups) {
    return co(function*() {
    
      return {
        switchOn: yield performChange(ec2.switchInstancesOn, actionGroups.switchOn, config.whatIf),
        switchOff: yield performChange(ec2.switchInstancesOff, actionGroups.switchOff, config.whatIf),
        putInService: yield performChange(ec2.putAsgInstancesInService, actionGroups.putInService, config.whatIf),
        putOutOfService: yield performChange(ec2.putAsgInstancesInStandby, actionGroups.putOutOfService, config.whatIf)
      };

    });
  }

  function performChange(doChange, actions, whatIf) {

    if (!actions.length || whatIf) {
      return Promise.resolve({ success: true });
    }

    let instances = actions.map(action => action.instance.InstanceId);

    return doChange(instances)
      .then(() => { return { success: true }; })
      .catch(err => { return { success: false, error: err }; });

  }

  return { doScheduling };

}

module.exports = {
  create: createScheduler
};