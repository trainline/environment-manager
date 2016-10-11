/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let config = require('config');
let GetASGState = require('queryHandlers/GetASGState');
let ScanServersStatus = require('queryHandlers/ScanServersStatus');
let co = require('co');
let Environment = require('models/Environment');

/**
 * GET /environments
 */
function getEnvironments(req, res, next) {
  res.json([{},{},{}]);
}

/**
 * GET /environments/{name}
 */
function getEnvironmentByName(req, res, next) {
  res.json({});
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
 * GET /environments/schedule-status
 */
function getEnvironmentsScheduleStatus(req, res, next) {
  let ScanDynamoResources = require('queryHandlers/ScanDynamoResources');
  const masterAccountName = config.getUserValue('masterAccountName');

  let filter = {};
  ScanDynamoResources({ resource: 'ops/environments', filter, exposeAudit: 'version-only', accountName: masterAccountName })
    .then(data => res.json(data)).catch(next);
}

function getEnvironmentScheduleStatus(req, res, next) {
  res.json({});
}

function putEnvironmentSchedule(req, res, next) {
  res.json();
}

module.exports = {
  getEnvironments,
  getEnvironmentByName,
  getEnvironmentAccountName,
  getEnvironmentServers,
  getEnvironmentServerByName,
  getEnvironmentScheduleStatus,
  getEnvironmentsScheduleStatus,
  putEnvironmentSchedule
};
