/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const RESOURCE = 'config/clusters';
const KEY_NAME = 'ClusterName';

let dynamoHelper = new (require('api/api-utils/DynamoHelper'))(RESOURCE);

/**
 * GET /config/clusters
 */
function getClustersConfig(req, res, next) {
  return dynamoHelper.getAll().then(data => res.json(data)).catch(next);
}

/**
 * GET /config/clusters/{name}
 */
function getClusterConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  return dynamoHelper.getByKey(key).then(data => res.json(data)).catch(next);
}

/**
 * POST /config/clusters
 */
function postClustersConfig(req, res, next) {
  const cluster = req.swagger.params.cluster.value;
  const user = req.user;
  return dynamoHelper.create({ Value: cluster.Value }, cluster[KEY_NAME], user).then(_ => res.status(201).end()).catch(next);
}

/**
 * PUT /config/clusters/{name}
 */
function putClusterConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  const expectedVersion = req.swagger.params['expected-version'].value;
  const cluster = req.swagger.params.cluster.value;
  const user = req.user;

  return dynamoHelper
    .update(key, { Value: cluster }, expectedVersion, user)
    .then(_ => res.status(200).end())
    .catch(next);
}

/**
 * DELETE /config/clusters/{name}
 */
function deleteClusterConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  const user = req.user;
  return dynamoHelper.deleteItem(key, user).then(_ => res.status(200).end()).catch(next);
}

module.exports = {
  getClustersConfig,
  getClusterConfigByName,
  postClustersConfig,
  putClusterConfigByName,
  deleteClusterConfigByName
};
