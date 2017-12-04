/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const KEY_NAME = 'ClusterName';

let clusters = require('../../../../modules/data-access/clusters');
let getMetadataForDynamoAudit = require('../../../api-utils/requestMetadata').getMetadataForDynamoAudit;
let param = require('../../../api-utils/requestParam');
let versionOf = require('../../../../modules/data-access/dynamoVersion').versionOf;
let removeAuditMetadata = require('../../../../modules/data-access/dynamoAudit').removeAuditMetadata;
const sns = require('../../../../modules/sns/EnvironmentManagerEvents');
let { hasValue, when } = require('../../../../modules/functional');
let { ifNotFound, notFoundMessage } = require('../../../api-utils/ifNotFound');

function keyOf(value) {
  let t = {};
  t[KEY_NAME] = value;
  return t;
}

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/clusters
 */
function getClustersConfig(req, res, next) {
  return clusters.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data)).catch(next);
}

/**
 * GET /config/clusters/{name}
 */
function getClusterConfigByName(req, res, next) {
  const key = param('name', req);
  return clusters.get(keyOf(key))
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('cluster')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/clusters
 */
function postClustersConfig(req, res, next) {
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, body);
  delete record.Version;
  return clusters.create({ record, metadata })
    .then(() => res.status(201).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/clusters',
          Method: 'POST'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: ''
      }
    }))
    .catch(next);
}

/**
 * PUT /config/clusters/{name}
 */
function putClusterConfigByName(req, res, next) {
  const key = param('name', req);
  const expectedVersion = param('expected-version', req);
  const body = param('body', req);

  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(keyOf(key), { Value: body });
  delete record.Version;

  return clusters.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/clusters/${key}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: key
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/clusters/{name}
 */
function deleteClusterConfigByName(req, res, next) {
  const clusterName = param('name', req);
  const expectedVersion = param('expected-version', req);

  let key = keyOf(clusterName);
  let metadata = getMetadataForDynamoAudit(req);

  return clusters.delete({ key, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/clusters/${key}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: clusterName
      }
    }))
    .catch(next);
}

module.exports = {
  getClustersConfig,
  getClusterConfigByName,
  postClustersConfig,
  putClusterConfigByName,
  deleteClusterConfigByName
};
