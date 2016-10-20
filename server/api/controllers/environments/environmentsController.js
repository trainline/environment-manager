/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let config = require('config');
let GetASGState = require('queryHandlers/GetASGState');
let ScanServersStatus = require('queryHandlers/ScanServersStatus');
let co = require('co');
let Environment = require('models/Environment');
let GetDynamoResource = require('queryHandlers/GetDynamoResource');
let sender = require('modules/sender');
let OpsEnvironment = require('models/OpsEnvironment');

/**
 * GET /environments
 */
function getEnvironments(req, res, next) {
  const masterAccountName = config.getUserValue('masterAccountName');

  let filter = {};
  OpsEnvironment.getAll().then((list) => {
    return list.map((env) => env.toAPIOutput())
  }).then((data) => res.json(data)).catch(next);
}

/**
 * GET /environments/{name}
 */
function getEnvironmentByName(req, res, next) {
  const environmentName = req.swagger.params.name.value;

  OpsEnvironment.getByName(environmentName).then((env) => env.toAPIOutput())
    .then((data) => res.json(data)).catch(next);
}

/**
 * GET /environments/{name}/servers
 */
function getEnvironmentServers(req, res, next) {
  const environmentName = req.swagger.params.name.value;

  ScanServersStatus({ environmentName, filter: {} }).then((data) => res.json(data)).catch(next);
}

/**
 * GET /environments/{name}/servers/{asgName}
 */
function getEnvironmentServerByName(req, res, next) {
  const environmentName = req.swagger.params.name.value;
  const asgName = req.swagger.params.asgName.value;

  GetASGState({ environmentName, asgName }).then((data) => res.json(data)).catch(next);
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
  const masterAccountName = config.getUserValue('masterAccountName');
  const key = req.swagger.params.name.value;

  GetDynamoResource({ resource: 'ops/environments', key, exposeAudit: 'version-only', accountName: masterAccountName })
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /environments/{name}/schedule
 */
function putEnvironmentSchedule(req, res, next) {
  const masterAccountName = config.getUserValue('masterAccountName');
  const key = req.swagger.params.name.value;
  const item = { Value: req.swagger.params.body.value };
  const user = req.user;

  const command = {
    name: 'UpdateDynamoResource',
    resource: 'ops/environments',
    key,
    item,
    expectedVersion: req.swagger.params['expected-version'].value,
    accountName: masterAccountName,
  };

  sender.sendCommand({ command, user }).then((data) => res.json(data)).catch(next);
}

/**
 * GET /environments/{name}/schedule-status
 */
function getEnvironmentScheduleStatus(req, res, next) {
  throw 'not working!!!!';
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
};
