/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let deploymentsHelper = require('modules/queryHandlersUtil/deployments-helper');
let GetNodeDeploymentLog = require('queryHandlers/deployments/GetNodeDeploymentLog');
let co = require('co');

/**
 * GET /deployments
 */
function getDeployments(req, res, next) {
  const since = req.swagger.params.since.value;
  const environment = req.swagger.params.environment.value;
  const status = req.swagger.params.status.value;
  const cluster = req.swagger.params.cluster.value;

  deploymentsHelper.scan({
    since, environment, status, cluster
  }).then((data) => res.json(data)).catch(next);
}

/**
 * GET /deployments/{key}
 */
function getDeploymentById(req, res, next) {
  const key = req.swagger.params.key.value;
  const account = req.swagger.params.account.value;

  return deploymentsHelper.get({ key, account });
}

/**
 * GET /deployments/{id}/log
 */
function getDeploymentLog(req, res, next) {
  return co(function* () {
    const key = req.swagger.params.id.value;
    const account = req.swagger.params.account.value;
    const node = req.swagger.params.instance.value;
    
    let deployment = yield deploymentsHelper.get({ key, account });
    let environment = deployment.Value.EnvironmentName;

    let query = {
      account,
      environment,
      deploymentId: key,
      node,
    };

    return GetNodeDeploymentLog(query).then(data => {
      res.send(data.replace(/\n/g,  '<br />'));
  res.json();
    });
  }).catch(next);
}

/**
 * POST /deployments
 */
function postDeployment(req, res, next) {
  res.json();
}

/**
 * PATCH /deployments
 */
function patchDeployment(req, res, next) {
}

module.exports = {
  getDeployments,
  getDeploymentById,
  getDeploymentLog,
  postDeployment,
  patchDeployment
};
