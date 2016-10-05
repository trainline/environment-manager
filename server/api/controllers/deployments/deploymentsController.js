/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let deployments = require('modules/queryHandlersUtil/deployments-helper');
let GetNodeDeploymentLog = require('queryHandlers/deployments/GetNodeDeploymentLog');

function getDeployments(req, res, next) {
  const since = req.swagger.params.since.value;
  const environment = req.swagger.params.environment.value;
  const status = req.swagger.params.status.value;
  const cluster = req.swagger.params.cluster.value;

  deployments.scan({
    since, environment, status, cluster
  }).then((data) => res.json(data)).catch(next);
}

function getDeploymentById(req, res) {
  res.json({});
}

function getDeploymentLog(req, res) {
  res.json({});
}

function postDeployment(req, res) {
  res.json();
}

function patchDeployment(req, res) {
  res.json();
}

module.exports = {
  getDeployments,
  getDeploymentById,
  getDeploymentLog,
  postDeployment,
  patchDeployment
};
