/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let getAccounts = require('queryHandlers/GetAWSaccounts');
let addAccount = require('commands/aws/AddAWSaccount');
let updateAccount = require('commands/aws/UpdateAWSaccount');
let removeAccount = require('commands/aws/RemoveAWSaccount');
let sns = require('modules/sns/EnvironmentManagerEvents');

/**
 * GET /config/accounts
 */
function getAccountsConfig(req, res, next) {
  return getAccounts({}).then(data => res.json(data)).catch(next);
}

/**
 * POST /config/accounts
 */
function postAccountsConfig(req, res, next) {
  const account = req.swagger.params.account.value;
  const user = req.user;

  return addAccount({
    account,
    user
  })
    .then(() => res.status(201).end())
    .then(sns.publish({
      message: 'POST /config/accounts',
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: account.AccountNumber
      }
    }))
    .catch(next);
}

/**
 * PUT /config/accounts/{accountNumber}
 */
function putAccountConfigByName(req, res, next) {
  const accountNumber = req.swagger.params.accountNumber.value;
  const account = req.swagger.params.account.value;
  const user = req.user;
  account.AccountNumber = accountNumber; // Prevent attempts to update the key

  return updateAccount({
    account,
    user
  })
    .then(() => res.status(200).end())
    .then(sns.publish({
      message: `PUT /config/accounts/${accountNumber}`,
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: accountNumber
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/accounts/{accountNumber}
 */
function deleteAccountConfigByName(req, res, next) {
  const accountNumber = req.swagger.params.accountNumber.value;
  const user = req.user;

  return removeAccount({
    accountNumber,
    user
  })
    .then(() => res.status(200).end())
    .then(sns.publish({
      message: `Delete /config/accounts/${accountNumber}`,
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: accountNumber
      }
    }))
    .catch(next);
}

module.exports = {
  getAccountsConfig,
  postAccountsConfig,
  putAccountConfigByName,
  deleteAccountConfigByName
};
