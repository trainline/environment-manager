/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const KEY_NAME = 'Name';

let permissions = require('modules/data-access/permissions');
let getMetadataForDynamoAudit = require('api/api-utils/requestMetadata').getMetadataForDynamoAudit;
let param = require('api/api-utils/requestParam');
let versionOf = require('modules/data-access/dynamoVersion').versionOf;
let removeAuditMetadata = require('modules/data-access/dynamoAudit').removeAuditMetadata;
const sns = require('modules/sns/EnvironmentManagerEvents');
let { hasValue, when } = require('modules/functional');
let { ifNotFound, notFoundMessage } = require('api/api-utils/ifNotFound');

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
 * GET /config/permissions
 */
function getPermissionsConfig(req, res, next) {
  return permissions.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data)).catch(next);
}

/**
 * GET /config/permissions/{name}
 */
function getPermissionConfigByName(req, res, next) {
  const key = param('name', req);
  return permissions.get(keyOf(key))
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('cluster')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/permissions
 */
function postPermissionsConfig(req, res, next) {
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, body);
  delete record.Version;
  return permissions.create({ record, metadata })
    .then(() => res.status(201).end())
    .then(sns.publish({
      message: 'Post /config/permissions',
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.POST,
        ID: body.Name
      }
    }))
    .catch(next);
}

/**
 * PUT /config/permissions/{name}
 */
function putPermissionConfigByName(req, res, next) {
  const key = param('name', req);
  const expectedVersion = param('expected-version', req);
  const body = param('body', req);

  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(keyOf(key), { Permissions: body });
  delete record.Version;

  return permissions.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(sns.publish({
      message: `Put /config/permissions/${key}`,
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.PUT,
        ID: key
      }
    }))
    .catch(next);
}

/**
 * DELETE /config/permissions/{name}
 */
function deletePermissionConfigByName(req, res, next) {
  const name = param('name', req);
  const expectedVersion = param('expected-version', req);

  let key = keyOf(name);
  let metadata = getMetadataForDynamoAudit(req);

  return permissions.delete({ key, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(sns.publish({
      message: `Put /config/permissions/${key}`,
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: name
      }
    }))
    .catch(next);
}

module.exports = {
  getPermissionsConfig,
  getPermissionConfigByName,
  postPermissionsConfig,
  putPermissionConfigByName,
  deletePermissionConfigByName
};
