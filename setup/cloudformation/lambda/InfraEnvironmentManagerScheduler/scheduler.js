/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const co = require('co');
const _ = require('lodash');

const awsFactory = require('./services/aws');
const reporting = require('./presentation/reporting');

function createScheduler(config, em, AWS, context) {
  function doScheduling () {
    return co(function*() {
      let accounts = yield em.getAccounts();

      let accountResults = yield accounts.map((account) => {
        return co(function*() {
          let aws = yield awsFactory.create(AWS, context, account);
          
          let allScheduledActions = yield getScheduledActions(account);
          let scheduledActions = maybeFilterActionsForASGInstances(allScheduledActions);
          let actionGroups = groupActionsByType(scheduledActions);

          let changeResults = yield performChanges(aws.ec2, actionGroups);

          return {
            accountName: account.AccountName,
            details: { actionGroups, changeResults }
          };
        });
      });

      return reporting.createReport(accountResults, config.listSkippedInstances);
    });
  }

  function maybeFilterActionsForASGInstances(instanceActions) {
    if (!config.ignoreASGInstances)
      return instanceActions;

    return instanceActions.filter(instanceAction => !instanceAction.instance.asg);
  }

  function getScheduledActions(account) {
    return em.getScheduledInstanceActions(account.AccountName).then(instanceActions => {
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

  function performChanges(ec2, actionGroups) {
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