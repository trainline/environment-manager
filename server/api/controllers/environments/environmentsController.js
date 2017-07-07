/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let GetASGState = require('queryHandlers/GetASGState');
let ScanServersStatus = require('queryHandlers/ScanServersStatus');
let co = require('co');
let Environment = require('models/Environment');
let OpsEnvironment = require('models/OpsEnvironment');
let Promise = require('bluebird');
let environmentProtection = require('modules/authorizers/environmentProtection');
let _ = require('lodash');
let opsEnvironment = require('modules/data-access/opsEnvironment');
let param = require('api/api-utils/requestParam');
let getMetadataForDynamoAudit = require('api/api-utils/requestMetadata').getMetadataForDynamoAudit;
const sns = require('modules/sns/EnvironmentManagerEvents');
let { when } = require('modules/functional');
let { ifNotFound, notFoundMessage } = require('api/api-utils/ifNotFound');

let environmentNotFound = notFoundMessage('environment');

/**
 * GET /environments
 */
function getEnvironments(req, res, next) {
  return OpsEnvironment.getAll()
    .then(list => Promise.map(list, env => env.toAPIOutput()))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /environments/{name}
 */
function getEnvironmentByName(req, res, next) {
  const environmentName = req.swagger.params.name.value;

  OpsEnvironment.getByName(environmentName)
    .then(when(env => !env.isNothing(), env => env.toAPIOutput()))
    .then(ifNotFound(environmentNotFound))
    .then(send => send(res))
    .catch(next);
}

/**
 * GET /environments/{name}/protected
 */
function isEnvironmentProtectedFromAction(req, res) {
  const environmentName = req.swagger.params.name.value;
  const action = req.swagger.params.action.value;

  environmentProtection.isActionProtected(environmentName, action)
    .then(isProtected => res.json({ isProtected }));
}

/**
 * GET /environments/{name}/deploy-lock
 */
function getDeploymentLock(req, res, next) {
  let key = {
    EnvironmentName: param('name', req)
  };
  opsEnvironment.get(key)
    .then(data => ({
      EnvironmentName: data.EnvironmentName,
      Value: {
        DeploymentsLocked: !!data.Value.DeploymentsLocked
      },
      Version: data.Audit.Version
    }))
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /environments/{name}/deploy-lock
 */
function putDeploymentLock(req, res, next) {
  let environmentName = param('name', req);
  let key = {
    EnvironmentName: environmentName
  };
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  let input = req.swagger.params.body.value;
  let isLocked = input.DeploymentsLocked;

  return opsEnvironment.setDeploymentLock({ key, metadata, isLocked }, expectedVersion)
    .then(data => res.json(data))
    .then(sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/environments/${environmentName}/deploy-lock`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: environmentName
      }
    }))
    .catch(next);
}

/**
 * GET /environments/{name}/maintenance
 */
function getMaintenance(req, res, next) {
  let key = {
    EnvironmentName: param('name', req)
  };
  opsEnvironment.get(key)
    .then(data => ({
      EnvironmentName: data.EnvironmentName,
      Value: {
        InMaintenance: !!data.Value.EnvironmentInMaintenance
      },
      Version: data.Audit.Version
    }))
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /environments/{name}/maintenance
 */
function putMaintenance(req, res, next) {
  let environmentName = param('name', req);
  let key = {
    EnvironmentName: environmentName
  };
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  let input = req.swagger.params.body.value;
  let isInMaintenance = input.InMaintenance;

  return opsEnvironment.setMaintenance({ key, metadata, isInMaintenance }, expectedVersion)
    .then(data => res.json(data))
    .then(sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/environments/${environmentName}/maintenance`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: environmentName
      }
    }))
    .catch(next);
}

/**
 * GET /environments/{name}/servers
 */
function getEnvironmentServers(req, res, next) {
  const environmentName = req.swagger.params.name.value;

  ScanServersStatus({ environmentName, filter: {} }).then(data => res.json(data)).catch(next);
}

/**
 * GET /environments/{name}/servers/{asgName}
 */
function getEnvironmentServerByName(req, res, next) {
  const environmentName = req.swagger.params.name.value;
  const asgName = req.swagger.params.asgName.value;

  GetASGState({ environmentName, asgName }).then(data => res.json(data)).catch(next);
}

/**
 * GET /environments/{name}/accountName
 */
function getEnvironmentAccountName(req, res, next) {
  const environmentName = req.swagger.params.name.value;

  return co(function* () { // eslint-disable-line func-names
    const accountName = yield (yield Environment.getByName(environmentName)).getAccountName();
    res.send(accountName);
  }).catch(next);
}

/**
 * GET /environments/{name}/schedule
 */
function getEnvironmentSchedule(req, res, next) {
  let key = {
    EnvironmentName: param('name', req)
  };
  opsEnvironment.get(key)
    .then(data => ({
      EnvironmentName: data.EnvironmentName,
      Value: {
        ManualScheduleUp: data.Value.ManualScheduleUp,
        ScheduleAutomatically: data.Value.ScheduleAutomatically,
        DefaultSchedule: data.Value.DefaultSchedule
      },
      Version: data.Audit.Version
    }))
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /environments/{name}/schedule
 */
function putEnvironmentSchedule(req, res, next) {
  let environmentName = param('name', req);
  let key = {
    EnvironmentName: environmentName
  };
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  let schedule = req.swagger.params.body.value;

  return opsEnvironment.setSchedule({ key, metadata, schedule }, expectedVersion)
    .then(data => res.json(data))
    .then(sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/environments/${environmentName}/schedule`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: environmentName
      }
    }))
    .catch(next);
}


/**
 * GET /environments/{name}/schedule-status
 */
function getEnvironmentScheduleStatus(req, res, next) {
  const environmentName = req.swagger.params.name.value;
  const at = req.swagger.params.at.value;

  return OpsEnvironment.getByName(environmentName)
    .then(env => ({ Status: env.getScheduleStatus(at) }))
    .then(data => res.json(data))
    .catch(next);
}

module.exports = {
  getEnvironments,
  getEnvironmentByName,
  getEnvironmentAccountName,
  getEnvironmentServers,
  getEnvironmentServerByName,
  getEnvironmentScheduleStatus,
  putEnvironmentSchedule,
  getEnvironmentSchedule,
  isEnvironmentProtectedFromAction,
  getMaintenance,
  putMaintenance,
  getDeploymentLock,
  putDeploymentLock
};
