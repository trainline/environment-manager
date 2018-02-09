/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let co = require('co');
let ec2Client = require('../../../modules/ec2-monitor/ec2-monitor-client');
let getAllASGs = require('../../../queryHandlers/ScanCrossAccountAutoScalingGroups');
let getAccountASGs = require('../../../queryHandlers/ScanAutoScalingGroups');
let getASG = require('../../../queryHandlers/GetAutoScalingGroup');
let AutoScalingGroup = require('../../../models/AutoScalingGroup');
let asgips = require('../../../modules/data-access/asgips');
let GetLaunchConfiguration = require('../../../queryHandlers/GetLaunchConfiguration');
let SetLaunchConfiguration = require('../../../commands/launch-config/SetLaunchConfiguration');
let SetAutoScalingGroupSize = require('../../../commands/asg/SetAutoScalingGroupSize');
let SetAutoScalingGroupSchedule = require('../../../commands/asg/SetAutoScalingGroupSchedule');
let UpdateAutoScalingGroup = require('../../../commands/asg/UpdateAutoScalingGroup');
let GetAutoScalingGroupScheduledActions = require('../../../queryHandlers/GetAutoScalingGroupScheduledActions');
let GetAutoScalingGroupLifeCycleHooks = require('../../../queryHandlers/GetAutoScalingGroupLifeCycleHooks');
let getASGReady = require('../../../modules/environment-state/getASGReady');
let Environment = require('../../../models/Environment');
let sns = require('../../../modules/sns/EnvironmentManagerEvents');
let opsEnvironment = require('../../../modules/data-access/opsEnvironment');

class ValidationError extends Error {
  constructor(obj) {
    super();
    Object.assign(this, obj);
  }
}

function checkEnvironmentExists(environmentName) {
  return environment => (environment
    ? Promise.resolve(environment)
    : Promise.reject(new ValidationError({
      errors: [
        { title: 'Environment Not Found', detail: `environment name: ${environmentName}` }
      ],
      status: 400
    })));
}

function checkEnvironmentUnlocked(environment) {
  return Promise.resolve()
    .then(() => {
      let { EnvironmentName, Value: { DeploymentsLocked = false } = {} } = environment || {};
      return DeploymentsLocked
        ? Promise.reject(new ValidationError({
          errors: [
            { title: 'Environment Locked', detail: `environment name: ${EnvironmentName}` }
          ],
          status: 400
        }))
        : Promise.resolve(environment);
    });
}

function handleValidationErrors(res) {
  return error => (error instanceof ValidationError
    ? res.status(error.status || 400).json({ errors: error.errors })
    : Promise.reject(error));
}

/**
 * GET /asgs
 */
function getAsgs(req, res, next) {
  const accountName = req.swagger.params.account.value;
  const environment = req.swagger.params.environment.value;

  return co(function* () {
    let list;
    if (environment !== undefined) {
      let account = yield Environment.getAccountNameForEnvironment(environment);
      let t = yield getAccountASGs({
        accountName: account
      });
      list = t.filter(asg => asg.getTag('Environment') === environment);
    } else if (accountName !== undefined) {
      list = yield getAccountASGs({
        accountName
      });
    } else {
      list = yield getAllASGs();
    }

    res.json(list);
  }).catch(next);
}


/**
 * GET /asgs
 */
function getAsgsEc2Monitor(req, res) {
  const accountName = req.swagger.params.account.value;
  const environmentName = req.swagger.params.environment.value;
  ec2Client.getHostGroups((e, r) => res.json(r), accountName, environmentName);
}

/**
 * GET /asgs/{name}
 */
function getAsgByName(req, res, next) {
  const autoScalingGroupName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;

  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    let lifecycleHooks = yield GetAutoScalingGroupLifeCycleHooks({ accountName, autoScalingGroupName });
    return getASG({ accountName, autoScalingGroupName }).then((data) => {
      res.json(Object.assign({}, data, { LifecycleHooks: lifecycleHooks }));
    });
  }).catch(next);
}

/**
 * GET /asgs/{name}
 */
function getAsgByNameEc2Monitor(req, res) {
  const autoScalingGroupName = req.swagger.params.name.value;
  ec2Client.getHostGroupByName(autoScalingGroupName, (e, r) => {
    res.json(r);
  });
}

/**
 * GET /asgs/{name}/ready
 */
function getAsgReadyByName(req, res, next) {
  const autoScalingGroupName = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;

  return getASGReady({
    autoScalingGroupName,
    environmentName
  })
    .then(data => res.json(data)).catch(next);
}


/**
 * GET /asgs/{name}/ips
 */
function getAsgIps(req, res, next) {
  const key = req.swagger.params.name.value;
  const environmentName = req.swagger.params.environment.value;
  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    asgips.get(accountName, { AsgName: key }).then(data => res.json(data));
  }).catch(next);
}

/**
 * GET /asgs/{name}/launch-config
 */
function getAsgLaunchConfig(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    GetLaunchConfiguration({ accountName, autoScalingGroupName }).then(data => res.json(data));
  }).catch(next);
}

/**
 * GET /asgs/{name}/scaling-schedule
 */
function getScalingSchedule(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    GetAutoScalingGroupScheduledActions({ accountName, autoScalingGroupName }).then(data => res.json(data));
  }).catch(next);
}

/**
 * PUT /asgs/{name}
 */
function putAsg(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;
  const parameters = req.swagger.params.body.value;

  return opsEnvironment.get({ EnvironmentName: environmentName })
    .then(checkEnvironmentExists(environmentName))
    .then(checkEnvironmentUnlocked)
    .then(() => UpdateAutoScalingGroup({
      environmentName,
      autoScalingGroupName,
      parameters
    }))
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/asgs/${autoScalingGroupName}`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: autoScalingGroupName
      }
    }))
    .catch(handleValidationErrors(res))
    .catch(next);
}

/**
 * DELETE /asgs/{name}
 */
function deleteAsg(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return opsEnvironment.get({ EnvironmentName: environmentName })
    .then(checkEnvironmentExists(environmentName))
    .then(checkEnvironmentUnlocked)
    .then(() => Environment.getAccountNameForEnvironment(environmentName))
    .then(accountName => AutoScalingGroup.getByName(accountName, autoScalingGroupName))
    .then(asg => asg.deleteASG())
    .then((status) => { res.json({ Ok: status }); })
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/asgs/${autoScalingGroupName}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.DELETE,
        ID: autoScalingGroupName
      }
    }))
    .catch(handleValidationErrors(res))
    .catch(next);
}

/**
 * PUT /asgs/{name}/scaling-schedule
 */
function putScalingSchedule(req, res, next) {
  const { propagateToInstances, schedule } = req.swagger.params.body.value;
  const environmentName = req.swagger.params.environment.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return opsEnvironment.get({ EnvironmentName: environmentName })
    .then(checkEnvironmentExists(environmentName))
    .then(checkEnvironmentUnlocked)
    .then(() => Environment.getAccountNameForEnvironment(environmentName))
    .then(accountName => SetAutoScalingGroupSchedule({
      accountName,
      autoScalingGroupName,
      schedule,
      propagateToInstances
    }))
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/asgs/${autoScalingGroupName}/scaling-schedule`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: autoScalingGroupName
      }
    }))
    .catch(handleValidationErrors(res))
    .catch(next);
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

  return opsEnvironment.get({ EnvironmentName: environmentName })
    .then(checkEnvironmentExists(environmentName))
    .then(checkEnvironmentUnlocked)
    .then(() => Environment.getAccountNameForEnvironment(environmentName))
    .then(accountName => SetAutoScalingGroupSize({
      accountName,
      autoScalingGroupName,
      autoScalingGroupMinSize,
      autoScalingGroupDesiredSize,
      autoScalingGroupMaxSize
    }))
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/asgs/${autoScalingGroupName}/size`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: autoScalingGroupName
      }
    }))
    .catch(handleValidationErrors(res))
    .catch(next);
}

/**
 * PUT /asgs/{name}/launch-config
 */
function putAsgLaunchConfig(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const data = req.swagger.params.body.value;
  const autoScalingGroupName = req.swagger.params.name.value;

  return opsEnvironment.get({ EnvironmentName: environmentName })
    .then(checkEnvironmentExists(environmentName))
    .then(checkEnvironmentUnlocked)
    .then(() => Environment.getAccountNameForEnvironment(environmentName))
    .then(accountName => SetLaunchConfiguration({
      accountName,
      autoScalingGroupName,
      data
    }))
    .then(x => res.json(x))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/asgs/${autoScalingGroupName}/launch-config`,
          Method: 'PUT'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Environment: environmentName,
        Action: sns.ACTIONS.PUT,
        ID: autoScalingGroupName
      }
    }))
    .catch(handleValidationErrors(res))
    .catch(next);
}

module.exports = {
  getAsgs,
  getAsgsEc2Monitor,
  getAsgByName,
  getAsgByNameEc2Monitor,
  getAsgReadyByName,
  getAsgIps,
  getAsgLaunchConfig,
  putScalingSchedule,
  getScalingSchedule,
  deleteAsg,
  putAsg,
  putAsgSize,
  putAsgLaunchConfig
};
