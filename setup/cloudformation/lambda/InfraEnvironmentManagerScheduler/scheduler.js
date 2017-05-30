/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const co = require('co');
const _ = require('lodash');

const reporting = require('./presentation/reporting');

function createScheduler(config, em, ec2) {

  function doScheduling () {
    return co(function*() {

      let allScheduledActions = yield getScheduledActions();
      let scheduledActions = maybeFilterActionsForASGInstances(allScheduledActions);

      let actionGroups = groupActionsByType(scheduledActions);

      let changeResults = yield performChanges(actionGroups);

      return reporting.createReport({ actionGroups, changeResults }, config.listSkippedInstances);

    });
  }

  function maybeFilterActionsForASGInstances(instanceActions) {
    if (!config.ignoreASGInstances)
      return instanceActions;

    return instanceActions.filter(instanceAction => !instanceAction.instance.asg);
  }

  function getScheduledActions() {
    return em.getScheduledInstanceActions().then(instanceActions => {
      return instanceActions.filter(x => environmentMatchesFilter(x.instance.environment, config.limitToEnvironment));
    });
  }

  function groupActionsByType(instanceActions) {

    let result = { switchOn: [], switchOff: [], putInService: [], putOutOfService: [], skip: [] };

    instanceActions.forEach(instanceAction => {
      result[instanceAction.action.action].push(instanceAction);
    });

    return result;

  }

  function environmentMatchesFilter(environmentName, environmentFilter) {

    if (!environmentFilter) return true;
    if (!environmentName) return false;

    var re = new RegExp(environmentFilter);
    return re.test(environmentName);

  }

  function performChanges(actionGroups) {
    return co(function*() {
    
      return {
        switchOn: yield performChange(ec2.switchInstancesOn, actionGroups.switchOn),
        switchOff: yield performChange(ec2.switchInstancesOff, actionGroups.switchOff),
        putInService: yield performChange(ec2.putAsgInstancesInService, actionGroups.putInService),
        putOutOfService: yield performChange(ec2.putAsgInstancesInStandby, actionGroups.putOutOfService)
      };

    });
  }

  function performChange(doChange, actions) {

    if (!actions.length || config.whatIf) {
      return Promise.resolve({ success: true });
    }

    let instances = actions.map(action => action.instance);

    return doChange(instances)
      .then(() => { return { success: true }; })
      .catch(err => { return { success: false, error: err }; });

  }

  return { doScheduling };

}

module.exports = {
  create: createScheduler
};