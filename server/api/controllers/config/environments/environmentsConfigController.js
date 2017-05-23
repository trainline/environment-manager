/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const KEY_NAME = 'EnvironmentName';

let _ = require('lodash');
let Promise = require('bluebird');

let getMetadataForDynamoAudit = require('api/api-utils/requestMetadata').getMetadataForDynamoAudit;
let removeAuditMetadata = require('modules/data-access/dynamoAudit').removeAuditMetadata;
let versionOf = require('modules/data-access/dynamoVersion').versionOf;
let param = require('api/api-utils/requestParam');

let configEnvironments = require('modules/data-access/configEnvironments');
let opsEnvironment = require('modules/data-access/opsEnvironment');
let loadBalancerUpstreams = require('modules/data-access/loadBalancerUpstreams');
let loadBalancerSettings = require('modules/data-access/loadBalancerSettings');

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
        ID: configEnv.EnvironmentName || 'None'
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
  let key = {
    EnvironmentName: environmentName
  };
  let metadata = getMetadataForDynamoAudit(req);

  return Promise.all([
    deleteLBSettingsForEnvironment(environmentName, metadata),
    deleteLBUpstreamsForEnvironment(environmentName, metadata),
    deleteConsulKeyValuePairs(environmentName)
  ])
    .then(() => opsEnvironment.delete({ key, metadata }))
    .then(() => configEnvironments.delete({ key, metadata }))
    .then(() => res.status(200).end())
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

function deleteLBSettingsForEnvironment(environmentName, metadata) {
  let params = {
    KeyConditionExpression: ['=', ['at', 'EnvironmentName'], ['val', environmentName]],
    ProjectionExpression: ['list', ', ', ['at', 'EnvironmentName'], ['at', 'VHostName'], ['at', 'Audit', 'Version']]
  };
  return loadBalancerSettings.query(params)
    .then(items => Promise.map(items, ({ EnvironmentName, VHostName, Audit: { Version: expectedVersion } }) =>
      loadBalancerSettings.delete({ key: { EnvironmentName, VHostName }, metadata }, expectedVersion)));
}

function deleteLBUpstreamsForEnvironment(environmentName, metadata) {
  return loadBalancerUpstreams.inEnvironment(environmentName)
    .then(({ Items }) => Promise.map(Items, ({ Key, Audit: { Version: expectedVersion } }) =>
      loadBalancerUpstreams.delete({ key: { Key }, metadata }, expectedVersion)));
}

module.exports = {
  getEnvironmentsConfig,
  getEnvironmentConfigByName,
  postEnvironmentsConfig,
  putEnvironmentConfigByName,
  deleteEnvironmentConfigByName
};
