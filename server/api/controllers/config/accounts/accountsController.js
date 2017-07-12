/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let accounts = require('modules/data-access/accounts');
let { getMetadataForDynamoAudit } = require('api/api-utils/requestMetadata');
let param = require('api/api-utils/requestParam');
let { validate } = require('commands/validators/awsAccountValidator');
let { versionOf } = require('modules/data-access/dynamoVersion');
let { removeAuditMetadata } = require('modules/data-access/dynamoAudit');
let sns = require('modules/sns/EnvironmentManagerEvents');

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/accounts
 */
function getAccountsConfig(req, res, next) {
  return accounts.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * POST /config/accounts
 */
function postAccountsConfig(req, res, next) {
  const account = req.swagger.params.account.value;
  let metadata = getMetadataForDynamoAudit(req);
  let record = account;
  return validate(account)
    .then(() => accounts.create({ record, metadata }))
    .then(() => res.status(201).end())
    .then(sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/accounts',
          Method: 'POST'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: `${account.AccountNumber}`
      }
    }))
    .catch(next);
}

/**
 * PUT /config/accounts/{accountNumber}
 */
function putAccountConfigByName(req, res, next) {
  const AccountNumber = req.swagger.params.accountNumber.value;
  const account = req.swagger.params.account.value;
  const expectedVersion = param('expected-version', req);

  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(account, { AccountNumber });

  return validate(account)
    .then(accounts.replace({ record, metadata }, expectedVersion))
    .then(() => res.status(200).end())
    .then(sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/accounts/${AccountNumber}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: `${AccountNumber}`
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/accounts/{accountNumber}
 */
function deleteAccountConfigByName(req, res, next) {
  const AccountNumber = req.swagger.params.accountNumber.value;
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  return accounts.delete({ key: { AccountNumber }, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/accounts/${AccountNumber}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: `${AccountNumber}`
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
