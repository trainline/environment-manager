/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const KEY_NAME = 'ClusterName';

let clusters = require('modules/data-access/clusters');
let crypto = require('crypto');
let versionOf = require('modules/data-access/dynamoVersion').versionOf;
let removeAuditMetadata = require('modules/data-access/dynamoAudit').removeAuditMetadata;

function keyOf(value) {
  let t = {};
  t[KEY_NAME] = value;
  return t;
}

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

let getMetadata = req => ({
  TransactionID: crypto.pseudoRandomBytes(4).toString('hex'),
  User: req.user.getName()
});

/**
 * GET /config/clusters
 */
function getClustersConfig(req, res, next) {
  return clusters.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data)).catch(next);
}

/**
 * GET /config/clusters/{name}
 */
function getClusterConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  return clusters.get(keyOf(key))
    .then(convertToApiModel)
    .then(data => res.json(data)).catch(next);
}

/**
 * POST /config/clusters
 */
function postClustersConfig(req, res, next) {
  const body = req.swagger.params.body.value;

  let metadata = getMetadata(req);
  let record = Object.assign({}, body);
  delete record.Version;
  return clusters.create({ record: body, metadata }).then(() => res.status(201).end()).catch(next);
}

/**
 * PUT /config/clusters/{name}
 */
function putClusterConfigByName(req, res, next) {
  const key = req.swagger.params.name.value;
  const expectedVersion = req.swagger.params['expected-version'].value;
  const body = req.swagger.params.body.value;

  let metadata = getMetadata(req);
  let record = Object.assign(keyOf(key), { Value: body });
  delete record.Version;

  return clusters.replace({ record, metadata }, expectedVersion)
    .then(() => res.status(200).end())
    .catch(next);
}

/**
 * DELETE /config/clusters/{name}
 */
function deleteClusterConfigByName(req, res, next) {
  const clusterName = req.swagger.params.name.value;
  const expectedVersion = req.swagger.params['expected-version'].value;

  let key = keyOf(clusterName);
  let metadata = getMetadata(req);

  return clusters.delete({ key, metadata }, expectedVersion)
    .then(() => res.status(200).end()).catch(next);
}

module.exports = {
  getClustersConfig,
  getClusterConfigByName,
  postClustersConfig,
  putClusterConfigByName,
  deleteClusterConfigByName
};
