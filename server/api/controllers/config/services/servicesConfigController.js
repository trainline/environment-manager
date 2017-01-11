/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const RESOURCE = 'config/services';
let dynamoHelper = new (require('api/api-utils/DynamoHelper'))(RESOURCE);

/**
 * GET /config/services
 */
function getServicesConfig(req, res, next) {
  const cluster = req.swagger.params.cluster.value;
  let filter = {};
  if (cluster !== undefined) {
    filter.OwningCluster = cluster;
  }
  return dynamoHelper.getAll(filter).then(data => res.json(data)).catch(next);
}

/**
 * GET /config/services/{name}
 */
function getServiceConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  const sortKey = req.swagger.params.cluster.value;
  return dynamoHelper.getBySortKey(key, sortKey).then(data => res.json(data)).catch(next);
}

/**
 * POST /config/services
 */
function postServicesConfig(req, res, next) {
  const body = req.swagger.params.body.value;
  const user = req.user;
  const key = body.ServiceName;
  const sortKey = body.OwningCluster;

  return dynamoHelper.createWithSortKey(key, sortKey, { Value: body.Value }, user).then(data => res.json(data)).catch(next);
}

/**
 * PUT /config/services/{name}/{cluster}
 */
function putServiceConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  const sortKey = req.swagger.params.cluster.value;
  const user = req.user;
  const expectedVersion = req.swagger.params['expected-version'].value;
  const body = req.swagger.params.body.value;

  return dynamoHelper.updateWithSortKey(key, sortKey, { Value: body }, expectedVersion, user).then(data => res.json(data)).catch(next);
}

/**
 * DELETE /config/services/{name}/{infra}
 */
function deleteServiceConfigByName(req, res, next) {
  const pKey = req.swagger.params.name.value;
  const sKey = req.swagger.params.cluster.value;
  const user = req.user;

  return dynamoHelper.deleteWithSortKey(pKey, sKey, user)
    .then(_ => res.status(200).end())
    .catch(next);
}

module.exports = {
  getServicesConfig,
  getServiceConfigByName,
  postServicesConfig,
  putServiceConfigByName,
  deleteServiceConfigByName,
};
