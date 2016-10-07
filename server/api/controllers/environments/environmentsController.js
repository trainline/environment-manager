/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let config = require('config');

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
  res.json([{},{},{}]);
}

/**
 * GET /environments/{name}/servers/{server}
 */
function getEnvironmentServerByName(req, res, next) {
  res.json({});
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
  getEnvironmentServers,
  getEnvironmentServerByName,
  getEnvironmentScheduleStatus,
  getEnvironmentsScheduleStatus,
  putEnvironmentSchedule
};
