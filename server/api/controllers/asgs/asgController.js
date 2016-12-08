/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let Enums = require('Enums');
let co = require('co');
let getAllASGs = require('queryHandlers/ScanCrossAccountAutoScalingGroups');
let getAccountASGs = require('queryHandlers/ScanAutoScalingGroups');
let getASG = require('queryHandlers/GetAutoScalingGroup');
let getDynamo = require('queryHandlers/GetDynamoResource');
let GetLaunchConfiguration = require('queryHandlers/GetLaunchConfiguration');
let SetLaunchConfiguration = require('commands/launch-config/SetLaunchConfiguration');
let SetAutoScalingGroupSize = require('commands/asg/SetAutoScalingGroupSize');
let SetAutoScalingGroupSchedule = require('commands/asg/SetAutoScalingGroupSchedule');
let UpdateAutoScalingGroup = require('commands/asg/UpdateAutoScalingGroup');
let GetAutoScalingGroupScheduledActions = require('queryHandlers/GetAutoScalingGroupScheduledActions');
let getASGReady = require('modules/environment-state/getASGReady');
let Environment = require('models/Environment');

/**
 * GET /asgs
 */
function getAsgs(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const environment = req.swagger.params.environment.value;

  return co(function* () {
    let list;
    if (accountName !== undefined) {
      list = yield getAccountASGs({ accountName });
    } else {
      list = yield getAllASGs();
    }

    res.json(list);
  }).catch(next);
}

/**
 * GET /asgs/{name}
 */
function getAsgByName(req, res, next) {
  const autoScalingGroupName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;

  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    return getASG({ accountName, autoScalingGroupName }).then(data => res.json(data)).catch(next);
  });
}


/**
 * GET /asgs/{name}/ready
 */
function getAsgReadyByName(req, res, next) {
  const autoScalingGroupName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;

  return getASGReady({ autoScalingGroupName, environmentName})
    .then((data) => res.json(data)).catch(next);
}


/**
 * GET /asgs/{name}/ips
 */
function getAsgIps(req, res, next) {
  const key = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;
  const resource = 'asgips';
  const exposeAudit = 'version-only';
  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    getDynamo({ accountName, key, resource, exposeAudit }).then(data => res.json(data)).catch(next);
  });
}

/**
 * GET /asgs/{name}/launch-config
 */
function getAsgLaunchConfig(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value

  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    GetLaunchConfiguration({ accountName, autoScalingGroupName }).then(data => res.json(data)).catch(next);
  });
}

/**
 * GET /asgs/{name}/scaling-schedule
 */
function getScalingSchedule(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    GetAutoScalingGroupScheduledActions({ accountName, autoScalingGroupName }).then(data => res.json(data)).catch(next);
  });
}

/**
 * PUT /asgs/{name}
 */
function putAsg(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  const parameters = req.swagger.params.body.value;

  UpdateAutoScalingGroup({ environmentName, autoScalingGroupName, parameters })
    .then(data => res.json(data)).catch(next);
}

/**
 * PUT /asgs/{name}/scaling-schedule
 */
function putScalingSchedule(req, res, next) {
  const body = req.swagger.params.body.value;
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return co(function* () {
    let data = {};

    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    let schedule = body.schedule;
    let propagateToInstances = body.propagateToInstances;

    data = yield SetAutoScalingGroupSchedule({ accountName, autoScalingGroupName, schedule, propagateToInstances });

    res.json(data);
  }).catch(next);
}

/**
 * PUT /asgs/{name}/size
 */
function putAsgSize(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;
  const body = req.swagger.params.body.value;
  const autoScalingGroupMinSize = body.min;
  const autoScalingGroupDesiredSize = body.desired;
  const autoScalingGroupMaxSize = body.max;

  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    SetAutoScalingGroupSize({ accountName, autoScalingGroupName,
      autoScalingGroupMinSize, autoScalingGroupDesiredSize, autoScalingGroupMaxSize })
      .then(data => res.json(data)).catch(next);
  });
}

/**
 * PUT /asgs/{name}/launch-config
 */
function putAsgLaunchConfig(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const data = req.swagger.params.body.value
  const autoScalingGroupName = req.swagger.params.name.value

  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    SetLaunchConfiguration({ accountName, autoScalingGroupName, data }).then(data => res.json(data)).catch(next);
  });
}

module.exports = {
  getAsgs,
  getAsgByName,
  getAsgReadyByName,
  getAsgIps,
  getAsgLaunchConfig,
  putScalingSchedule,
  getScalingSchedule,
  putAsg,
  putAsgSize,
  putAsgLaunchConfig
};
