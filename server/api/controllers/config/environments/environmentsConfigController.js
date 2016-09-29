'use strict';

const RESOURCE = 'config/environments';
const KEY_NAME = 'EnvironmentName';

let envConfig = require('api/api-utils/configController');

/**
 * GET /config/environments
 */
function getEnvironmentsConfig(req, res, next) {
  return envConfig.getAll(RESOURCE).then(data => res.json(data)).catch(next);
}

/**
 * GET /config/environments/{name}
 */
function getEnvironmentConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  return envConfig.getByKey(RESOURCE, key).then(data => res.json(data)).catch(next);
}

/**
 * POST /config/environments
 */
function postEnvironmentsConfig(req, res, next) {
  const environment = req.swagger.params.body.value;
  const user = req.user;

  return envConfig.create(RESOURCE, environment, KEY_NAME, user).then(_ => res.status(201).end()).catch(next);
}

/**
 * PUT /config/environments/{name}
 */
function putEnvironmentConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  const expectedVersion = req.swagger.params['expected-version'].value;
  const environment = req.swagger.params.body.value;
  const user = req.user;

  return envConfig
    .update(RESOURCE, key, KEY_NAME, environment, expectedVersion, user)
    .then(_ => res.status(200).end())
    .catch(next);
}

/**
 * DELETE /config/environments/{name}
 */
function deleteEnvironmentConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  const user = req.user;
  return envConfig.deleteItem(RESOURCE, key, user).then(_ => res.status(200).end()).catch(next);
}

module.exports = {
  getEnvironmentsConfig,
  getEnvironmentConfigByName,
  postEnvironmentsConfig,
  putEnvironmentConfigByName,
  deleteEnvironmentConfigByName
};
