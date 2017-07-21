/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const co = require('co');
const _ = require('lodash');

const awsFactory = require('./services/aws');
const reporting = require('./presentation/reporting');

function createScheduler(config, em, AWS, context, logger) {
  function doScheduling () {
    return co(function*() {
      let accounts = yield getAccounts();

      let accountResults = yield accounts.map((account) => {
        return co(function*() {
          let aws = yield awsFactory.create(AWS, context, account, logger);
          
          let allScheduledActions = yield getScheduledActions(account);
          let scheduledActions = maybeFilterActionsForASGInstances(allScheduledActions);
          let actionGroups = groupActionsByType(scheduledActions);

          let changeResults = yield performChanges(aws, actionGroups);

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

  function getAccounts() {
    return co(function*() {
      let allAccounts = yield em.getAccounts();

      if (!config.limitToAccounts.length) return allAccounts;
      return allAccounts.filter(x => _.includes(config.limitToAccounts, x.AccountName));
    });
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

  function performChanges(aws, actionGroups) {
    return co(function*() {
      return {
        switchOn: yield performChange(aws.ec2.switchInstancesOn, actionGroups.switchOn),
        switchOff: yield performChange(aws.ec2.switchInstancesOff, actionGroups.switchOff),
        putInService: yield performChange(aws.autoScaling.putInstancesInService, actionGroups.putInService),
        putOutOfService: yield performChange(aws.autoScaling.putInstancesInStandby, actionGroups.putOutOfService)
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