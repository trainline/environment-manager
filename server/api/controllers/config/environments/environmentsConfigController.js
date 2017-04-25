/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const KEY_NAME = 'EnvironmentName';

let _ = require('lodash');
let co = require('co');
let Promise = require('bluebird');

let DynamoHelper = require('api/api-utils/DynamoHelper');
let getMetadataForDynamoAudit = require('api/api-utils/requestMetadata').getMetadataForDynamoAudit;
let removeAuditMetadata = require('modules/data-access/dynamoAudit').removeAuditMetadata;
let versionOf = require('modules/data-access/dynamoVersion').versionOf;
let param = require('api/api-utils/requestParam');

let configEnvironments = require('modules/data-access/configEnvironments');
let opsEnvironment = require('modules/data-access/opsEnvironment');
let lbSettingsTable = new DynamoHelper('config/lbsettings');
let lbUpstreamsTable = new DynamoHelper('config/lbupstream');

let Environment = require('models/Environment');
let EnvironmentType = require('models/EnvironmentType');

let consul = require('modules/service-targets/consul');
const sns = require('modules/sns/EnvironmentManagerEvents');

let { hasValue, when } = require('modules/functional');
let { ifNotFound, notFoundMessage } = require('api/api-utils/ifNotFound');

function attachMetadata(input) {
  input.Version = versionOf(input);
  return EnvironmentType.getByName(input.Value.EnvironmentType)
    .then((environmentType) => {
      input.AWSAccountNumber = environmentType.AWSAccountNumber;
      return input;
    });
}

/**
 * GET /config/environments
 */
function getEnvironmentsConfig(req, res, next) {
  const environmentType = param('environmentType', req);
  const cluster = param('cluster', req);

  let getResults = () => {
    let predicates = [
      ...(cluster ? [['=', ['at', 'Value', 'OwningCluster'], ['val', cluster]]] : []),
      ...(environmentType ? [['=', ['at', 'Value', 'EnvironmentType'], ['val', environmentType]]] : [])
    ];
    if (predicates.length === 0) {
      return configEnvironments.scan();
    } else {
      let filter = predicates.length === 1 ? predicates[0] : ['and', ...predicates];
      return configEnvironments.scan({ FilterExpression: filter });
    }
  };

  return Promise.map(getResults(), attachMetadata)
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/environments/{name}
 */
function getEnvironmentConfigByName(req, res, next) {
  let key = {
    EnvironmentName: param('name', req)
  };
  return configEnvironments.get(key)
    .then(when(hasValue, attachMetadata))
    .then(when(hasValue, removeAuditMetadata))
    .then(ifNotFound(notFoundMessage('environment')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/environments
 */
function postEnvironmentsConfig(req, res, next) {
  let configEnv = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let opsEnv = {
    EnvironmentName: configEnv.EnvironmentName,
    Value: {}
  };
  return Promise.all([
    configEnvironments.create({ record: configEnv, metadata }),
    opsEnvironment.create({ record: opsEnv, metadata })
  ])
    .then(() => res.status(201).end())
    .then(sns.publish({
      message: 'Post /config/environments',
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: ''
      }
    }))
    .catch(next);
}

/**
 * PUT /config/environments/{name}
 */
function putEnvironmentConfigByName(req, res, next) {
  let environmentName = param('name', req);
  let key = {
    EnvironmentName: environmentName
  };
  let expectedVersion = param('expected-version', req);
  let body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(key, { Value: body });

  return configEnvironments.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(sns.publish({
      message: `Put /config/clusters/${environmentName}`,
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: environmentName
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/environments/{name}
 */
function deleteEnvironmentConfigByName(req, res, next) {
  const environmentName = param('name', req);
  const user = req.user;
  let key = {
    EnvironmentName: environmentName
  };
  let metadata = getMetadataForDynamoAudit(req);

  return co(function* () { // eslint-disable-line func-names
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);

    yield [
      deleteLBSettingsForEnvironment(environmentName, accountName, user),
      deleteLBUpstreamsForEnvironment(environmentName, accountName, user),
      deleteConsulKeyValuePairs(environmentName)
    ];

    yield opsEnvironment.delete({ key, metadata });
    yield configEnvironments.delete({ key, metadata });
    res.status(200).end();
  })
    .then(sns.publish({
      message: `Delete /config/environments/${environmentName}`,
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: environmentName
      }
    }))
    .catch(next);
}

function deleteConsulKeyValuePairs(environmentName) {
  return consul.removeTargetState(environmentName, { key: `environments/${environmentName}`, recurse: true });
}

function deleteLBSettingsForEnvironment(environmentName, accountName, user) {
  return co(function* () { // eslint-disable-line func-names
    let lbSettingsList = yield ignoreNotFoundResults(lbSettingsTable.queryRangeByKey(environmentName));
    return lbSettingsList.map(lbSettings =>
      lbSettingsTable.deleteWithSortKey(environmentName, lbSettings.VHostName, user, { accountName }));
  });
}

function deleteLBUpstreamsForEnvironment(environmentName, accountName, user) {
  return co(function* () { // eslint-disable-line func-names
    let allLBUpstreams = yield ignoreNotFoundResults(lbUpstreamsTable.getAll(null, { accountName }));
    let lbUpstreams = allLBUpstreams.filter(lbUpstream =>
      lbUpstream.Value.EnvironmentName.toLowerCase() === environmentName.toLowerCase());

    return lbUpstreams.map(lbUpstream => lbUpstreamsTable.delete(lbUpstream.key, user, { accountName }));
  });
}

function ignoreNotFoundResults(promise) {
  return promise.catch((err) => {
    if (err.message.match(/^No .* items found .*$/)) return [];
    throw err;
  });
}

module.exports = {
  getEnvironmentsConfig,
  getEnvironmentConfigByName,
  postEnvironmentsConfig,
  putEnvironmentConfigByName,
  deleteEnvironmentConfigByName
};
