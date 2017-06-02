/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict'

const _ = require('lodash');

function createReport(accounts, listSkippedInstances) {
  let success = _.every(accounts, accountWasSuccessfullyScheduled);

  let result = {
    success: success,
    accountReports: accounts.map(account => createAccountReport(account, listSkippedInstances))
  };

  return result;
}

function createAccountReport(account, listSkippedInstances) {
  let result = {
    accountName: account.accountName,
    switchOn: {
      result: account.details.changeResults.switchOn,
      instances: account.details.actionGroups.switchOn
    },
    switchOff: {
      result: account.details.changeResults.switchOff,
      instances: account.details.actionGroups.switchOff
    },
    putInService: {
      result: account.details.changeResults.putInService,
      instances: account.details.actionGroups.putInService
    },
    putOutOfService: {
      result: account.details.changeResults.putOutOfService,
      instances: account.details.actionGroups.putOutOfService
    }
  };

  if (listSkippedInstances)
    result.skip = account.details.actionGroups.skip;

  return result;
}

function accountWasSuccessfullyScheduled(account) {
  return account.details.changeResults.switchOff.success &&
    account.details.changeResults.switchOn.success &&
    account.details.changeResults.putInService.success &&
    account.details.changeResults.putOutOfService.success;
}

module.exports = {
  createReport
}