/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const KEY_NAME = 'EnvironmentType';

let configEnvironmentTypes = require('../../../../modules/data-access/configEnvironmentTypes');
let getMetadataForDynamoAudit = require('../../../api-utils/requestMetadata').getMetadataForDynamoAudit;
let param = require('../../../api-utils/requestParam');
let { versionOf } = require('../../../../modules/data-access/dynamoVersion');
const sns = require('../../../../modules/sns/EnvironmentManagerEvents');
let { hasValue, when } = require('../../../../modules/functional');
let { ifNotFound, notFoundMessage } = require('../../../api-utils/ifNotFound');

function keyOf(value) {
  let t = {};
  t[KEY_NAME] = value;
  return t;
}

function convertToApiModel(persistedModel) {
  let Version = versionOf(persistedModel);
  return Object.assign(persistedModel, { Version });
}

/**
 * GET /config/environment-types
 */
function getEnvironmentTypesConfig(req, res, next) {
  return configEnvironmentTypes.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/environment-types/{name}
 */
function getEnvironmentTypeConfigByName(req, res, next) {
  const key = param('name', req);
  return configEnvironmentTypes.get(keyOf(key))
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('environment type')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/environment-types
 */
function postEnvironmentTypesConfig(req, res, next) {
  const body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, body);
  delete record.Version;
  return configEnvironmentTypes.create({ record, metadata })
    .then(() => res.status(201).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/environment-types',
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
 * PUT /config/environment-types/{name}
 */
function putEnvironmentTypeConfigByName(req, res, next) {
  const key = param('name', req);
  const expectedVersion = param('expected-version', req);
  const body = param('body', req);

  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(keyOf(key), { Value: body });
  delete record.Version;

  return configEnvironmentTypes.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/environment-types/${key}`,
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
 * DELETE /config/environment-types/{name}
 */
function deleteEnvironmentTypeConfigByName(req, res, next) {
  const clusterName = param('name', req);

  let key = keyOf(clusterName);
  let metadata = getMetadataForDynamoAudit(req);

  return configEnvironmentTypes.delete({ key, metadata })
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/environment-types/${clusterName}`,
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
  getEnvironmentTypesConfig,
  getEnvironmentTypeConfigByName,
  postEnvironmentTypesConfig,
  putEnvironmentTypeConfigByName,
  deleteEnvironmentTypeConfigByName
};
