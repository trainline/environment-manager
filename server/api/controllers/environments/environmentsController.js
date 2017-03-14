/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let GetASGState = require('queryHandlers/GetASGState');
let ScanServersStatus = require('queryHandlers/ScanServersStatus');
let co = require('co');
let Environment = require('models/Environment');
let GetDynamoResource = require('queryHandlers/GetDynamoResource');
let sender = require('modules/sender');
let OpsEnvironment = require('models/OpsEnvironment');
let Promise = require('bluebird');
let environmentProtection = require('modules/authorizers/environmentProtection');
let awsAccounts = require('modules/awsAccounts');
let _ = require('lodash');

/**
 * GET /environments
 */
function getEnvironments(req, res, next) {
  OpsEnvironment.getAll().then(list => Promise.map(list, env => env.toAPIOutput())).then(data => res.json(data)).catch(next);
}

/**
 * GET /environments/{name}
 */
function getEnvironmentByName(req, res, next) {
  const environmentName = req.swagger.params.name.value;

  OpsEnvironment.getByName(environmentName).then(env => env.toAPIOutput())
    .then(data => res.json(data)).catch(next);
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
  awsAccounts.getMasterAccountName()
    .then((masterAccountName) => {
      const key = req.swagger.params.name.value;
      return GetDynamoResource({ resource: 'ops/environments', key, exposeAudit: 'version-only', accountName: masterAccountName });
    })       
    .then(data => ({
      EnvironmentName: data.EnvironmentName,
      Value: {
        DeploymentsLocked: !!data.Value.DeploymentsLocked,
      },
      Version: data.Version
    }))
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /environments/{name}/deploy-lock
 */
function putDeploymentLock(req, res, next) {
  const environmentName = req.swagger.params.name.value;
  const user = req.user;

  let input = req.swagger.params.body.value
  let update = { DeploymentsLocked: input.DeploymentsLocked };
  let expectedVersion = req.swagger.params['expected-version'].value;

  updateOpsEnvironment(environmentName, update, expectedVersion, user)
    .then(data => res.json(data)).catch(next);
}

/**
 * GET /environments/{name}/maintenance
 */
function getMaintenance(req, res, next) {
  awsAccounts.getMasterAccountName()
    .then((masterAccountName) => {
      const key = req.swagger.params.name.value;
      return GetDynamoResource({ resource: 'ops/environments', key, exposeAudit: 'version-only', accountName: masterAccountName });
    })       
    .then(data => ({
      EnvironmentName: data.EnvironmentName,
      Value: {
        InMaintenance: !!data.Value.EnvironmentInMaintenance,
      },
      Version: data.Version
    }))
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /environments/{name}/maintenance
 */
function putMaintenance(req, res, next) {
  const environmentName = req.swagger.params.name.value;
  const user = req.user;

  let input = req.swagger.params.body.value
  let update = { EnvironmentInMaintenance: input.InMaintenance };
  let expectedVersion = req.swagger.params['expected-version'].value;

  updateOpsEnvironment(environmentName, update, expectedVersion, user)
    .then(data => res.json(data)).catch(next);
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

  return co(function* () {
    const accountName = yield (yield Environment.getByName(environmentName)).getAccountName();
    res.send(accountName);
  }).catch(next);
}

/**
 * GET /environments/{name}/schedule
 */
function getEnvironmentSchedule(req, res, next) {
  awsAccounts.getMasterAccountName()
    .then((masterAccountName) => {
      const key = req.swagger.params.name.value;
      return GetDynamoResource({ resource: 'ops/environments', key, exposeAudit: 'version-only', accountName: masterAccountName });
    })       
    .then(data => ({
      EnvironmentName: data.EnvironmentName,
      Value: {
        ManualScheduleUp: data.Value.ManualScheduleUp,
        ScheduleAutomatically: data.Value.ScheduleAutomatically,
        DefaultSchedule: data.Value.DefaultSchedule
      },
      Version: data.Version
    }))
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /environments/{name}/schedule
 */
function putEnvironmentSchedule(req, res, next) {
  const environmentName = req.swagger.params.name.value;
  const user = req.user;

  let update = req.swagger.params.body.value
  let expectedVersion = req.swagger.params['expected-version'].value;

  updateOpsEnvironment(environmentName, update, expectedVersion, user)
    .then(data => res.json(data)).catch(next);
}

function updateOpsEnvironment(environmentName, update, expectedVersion, user) {
  return co(function* () {
    let { masterAccountName, environment } = {
      masterAccountName: yield awsAccounts.getMasterAccountName(),
      environment: yield OpsEnvironment.getByName(environmentName)
    };

    let item = { Value: _.assign({}, environment.Value, update) };

    const command = {
      name: 'UpdateDynamoResource',
      resource: 'ops/environments',
      key: environmentName,
      item,
      expectedVersion,
      accountName: masterAccountName
    };

    return sender.sendCommand({ command, user });
  });
}

/**
 * GET /environments/{name}/schedule-status
 */
function getEnvironmentScheduleStatus(req, res, next) {
  const environmentName = req.swagger.params.name.value;
  const at = req.swagger.params.at.value;

  OpsEnvironment.getByName(environmentName).then(env => ({ Status: env.getScheduleStatus(at) })).then(data => res.json(data)).catch(next);
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
