/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let deploymentMaps = require('../../../../modules/data-access/deploymentMaps');
let getMetadataForDynamoAudit = require('../../../api-utils/requestMetadata').getMetadataForDynamoAudit;
let param = require('../../../api-utils/requestParam');
let versionOf = require('../../../../modules/data-access/dynamoVersion').versionOf;
let removeAuditMetadata = require('../../../../modules/data-access/dynamoAudit').removeAuditMetadata;
const sns = require('../../../../modules/sns/EnvironmentManagerEvents');
let { hasValue, when } = require('../../../../modules/functional');
let { ifNotFound, notFoundMessage } = require('../../../api-utils/ifNotFound');

const KEY_NAME = 'DeploymentMapName';
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
 * GET /config/deployment-maps
 */
function getDeploymentMapsConfig(req, res, next) {
  return deploymentMaps.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/deployment-maps/{name}
 */
function getDeploymentMapConfigByName(req, res, next) {
  let key = param('name', req);
  return deploymentMaps.get(keyOf(key))
    .then(when(hasValue, convertToApiModel))
    .then(ifNotFound(notFoundMessage('deployment map')))
    .then(send => send(res))
    .catch(next);
}

/**
 * POST /config/deployment-maps
 */
function postDeploymentMapsConfig(req, res, next) {
  const body = param('body', req);
  let record = body;
  const validationErrors = validateDeploymentTargets(record.Value.DeploymentTarget);

  if (validationErrors.length > 0) {
    res.status(400).send({ errors: validationErrors });
    return next();
  }

  delete record.Version;
  let metadata = getMetadataForDynamoAudit(req);
  return deploymentMaps.create({ record, metadata })
    .then(() => res.status(201).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: '/config/deployment-maps',
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
 * PUT /config/deployment-maps/{name}
 */
function putDeploymentMapConfigByName(req, res, next) {
  const key = param('name', req);
  const expectedVersion = param('expected-version', req);
  const body = param('body', req);

  const validationErrors = validateDeploymentTargets(body.DeploymentTarget);

  if (validationErrors.length > 0) {
    res.status(400).send({ errors: validationErrors });
    return next();
  }

  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign(keyOf(key), { Value: body });
  delete record.Version;

  return deploymentMaps.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/deployment-maps/${key}`,
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
 * DELETE /config/deployment-maps/{name}
 */
function deleteDeploymentMapConfigByName(req, res, next) {
  const key = keyOf(param('name', req));
  let metadata = getMetadataForDynamoAudit(req);

  return deploymentMaps.delete({ key, metadata })
    .then(() => res.status(200).end())
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/config/deployment-maps/${key}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.CONFIGURATION_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: key
      }
    }))
    .catch(next);
}

function validateDeploymentTargets(deploymentTargets) {
  let errors = [];
  deploymentTargets.forEach((deploymentTarget) => {
    if (!deploymentTarget.OwningCluster) {
      errors.push({ detail: `${deploymentTarget.ServerRoleName} - OwningCluster is a required field.` });
    } else if (deploymentTarget.OwningCluster === 'Any') {
      errors.push({ detail: `${deploymentTarget.ServerRoleName} - Invalid OwningCluster: ${deploymentTarget.OwningCluster}.` });
    }

    if (!deploymentTarget.ContactEmailTag) {
      errors.push({ detail: `${deploymentTarget.ServerRoleName} - ContactEmailTag is a required field.` });
    } else if (!isEmailValid(deploymentTarget.ContactEmailTag)) {
      errors.push({ detail: `${deploymentTarget.ServerRoleName} - Invalid ContactEmailTag: ${deploymentTarget.ContactEmailTag}.` });
    }

    if (!deploymentTarget.AMI) {
      errors.push({ detail: `${deploymentTarget.ServerRoleName} - AMI is a required field.` });
    }
  });

  return errors;
}

function isEmailValid(email) {
  let re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

module.exports = {
  getDeploymentMapsConfig,
  getDeploymentMapConfigByName,
  postDeploymentMapsConfig,
  putDeploymentMapConfigByName,
  deleteDeploymentMapConfigByName
};
