/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const RESOURCE = 'config/deploymentmaps';
const KEY_NAME = 'DeploymentMapName';

let dmConfig = require('api/api-utils/configController');

/**
 * GET /config/deployment-maps
 */
function getDeploymentMapsConfig(req, res, next) {
  return dmConfig.getAll(RESOURCE).then(data => res.json(data)).catch(next);
}

/**
 * GET /config/deployment-maps/{name}
 */
function getDeploymentMapConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  return dmConfig.getByKey(RESOURCE, key).then(data => res.json(data)).catch(next);
}

/**
 * POST /config/deployment-maps
 */
function postDeploymentMapsConfig(req, res, next) {
  const deploymentMap = req.swagger.params.body.value;
  const user = req.user;

  return dmConfig.create(RESOURCE, deploymentMap, KEY_NAME, user).then(_ => res.status(201).end()).catch(next);
}

/**
 * PUT /config/deployment-maps/{name}
 */
function putDeploymentMapConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  const expectedVersion = req.swagger.params['expected-version'].value;
  const deploymentMap = req.swagger.params.body.value;
  const user = req.user;

  return dmConfig
    .update(RESOURCE, key, KEY_NAME, deploymentMap, expectedVersion, user)
    .then(_ => res.status(200).end())
    .catch(next);
}

/**
 * DELETE /config/deployment-maps/{name}
 */
function deleteDeploymentMapConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  const user = req.user;
  return dmConfig.deleteItem(RESOURCE, key, user).then(_ => res.status(200).end()).catch(next);
}

module.exports = {
  getDeploymentMapsConfig,
  getDeploymentMapConfigByName,
  postDeploymentMapsConfig,
  putDeploymentMapConfigByName,
  deleteDeploymentMapConfigByName
};
