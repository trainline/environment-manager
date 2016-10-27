/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const RESOURCE = 'config/environments';
const KEY_NAME = 'EnvironmentName';

let _ = require('lodash');
let dynamoHelper = new (require('api/api-utils/DynamoHelper'))(RESOURCE);

/**
 * GET /config/environments
 */
function getEnvironmentsConfig(req, res, next) {
  const environmentType = req.swagger.params.environmentType.value;
  const cluster = req.swagger.params.cluster.value;

  let filter = {
    'Value.OwningCluster': cluster,
    'Value.EnvironmentType': environmentType
  };
  filter = _.omitBy(filter, _.isUndefined);

  return dynamoHelper.getAll(filter).then(data => res.json(data)).catch(next);
}

/**
 * GET /config/environments/{name}
 */
function getEnvironmentConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  return dynamoHelper.getByKey(key).then(data => res.json(data)).catch(next);
}

/**
 * POST /config/environments
 */
function postEnvironmentsConfig(req, res, next) {
  const environment = req.swagger.params.body.value;
  const user = req.user;

  return dynamoHelper.create(environment[KEY_NAME], { Value: environment.Value }, user).then(_ => res.status(201).end()).catch(next);
}

/**
 * PUT /config/environments/{name}
 */
function putEnvironmentConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  const expectedVersion = req.swagger.params['expected-version'].value;
  const environment = req.swagger.params.body.value;
  const user = req.user;

  return dynamoHelper
    .update(key, { Value: environment }, expectedVersion, user)
    .then(_ => res.status(200).end())
    .catch(next);
}

/**
 * DELETE /config/environments/{name}
 */
function deleteEnvironmentConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  const user = req.user;
  return dynamoHelper.delete(key, user).then(_ => res.status(200).end()).catch(next);
}

module.exports = {
  getEnvironmentsConfig,
  getEnvironmentConfigByName,
  postEnvironmentsConfig,
  putEnvironmentConfigByName,
  deleteEnvironmentConfigByName
};
