/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let services = require('modules/data-access/services');
let getMetadataForDynamoAudit = require('api/api-utils/requestMetadata').getMetadataForDynamoAudit;
let param = require('api/api-utils/requestParam');
let versionOf = require('modules/data-access/dynamoVersion').versionOf;
let removeAuditMetadata = require('modules/data-access/dynamoAudit').removeAuditMetadata;
const sns = require('modules/sns/EnvironmentManagerEvents');

let { hasValue, when } = require('modules/functional');
let { ifNotFound, notFoundMessage } = require('api/api-utils/ifNotFound');

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/services
 */
function getServicesConfig(req, res, next) {
  const cluster = param('cluster', req);
  return (cluster ? services.ownedBy(cluster) : services.scan())
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/services/{name}/{cluster}
 */
function getServiceConfigByName(req, res, next) {
  let key = {
    ServiceName: param('name', req),
    OwningCluster: param('cluster', req)
  };
  return services.get(key)
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('service')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/services
 */
function postServicesConfig(req, res, next) {
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, body);
  delete record.Version;
  return services.create({ record, metadata })
    .then(() => res.status(201).end())
    .then(sns.publish({
      message: 'Post /config/services',
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: ''
      }
    }))
    .catch(next);
}

/**
 * PUT /config/services/{name}/{cluster}
 */
function putServiceConfigByName(req, res, next) {
  let serviceName = param('name', req);
  let owningCluster = param('cluster', req);
  let key = {
    ServiceName: serviceName,
    OwningCluster: owningCluster
  };
  const expectedVersion = param('expected-version', req);
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(key, { Value: body });
  delete record.Version;

  return services.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(sns.publish({
      message: `Put /config/services/${serviceName}/${owningCluster}`,
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: `${serviceName}/${owningCluster}`
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/services/{name}/{cluster}
 */
function deleteServiceConfigByName(req, res, next) {
  let serviceName = param('name', req);
  let owningCluster = param('cluster', req);
  let key = {
    ServiceName: serviceName,
    OwningCluster: owningCluster
  };
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  return services.delete({ key, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(sns.publish({
      message: `Delete /config/services/${serviceName}/${owningCluster}`,
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: `${serviceName}/${owningCluster}`
      }
    }))
    .catch(next);
}

module.exports = {
  getServicesConfig,
  getServiceConfigByName,
  postServicesConfig,
  putServiceConfigByName,
  deleteServiceConfigByName
};
