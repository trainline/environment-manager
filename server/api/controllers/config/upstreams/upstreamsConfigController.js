/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const RESOURCE = 'config/lbupstream';

let Promise = require('bluebird');
let { flatten, flow, map } = require('lodash/fp');
let { versionOf } = require('modules/data-access/dynamoVersion');
let { removeAuditMetadata } = require('modules/data-access/dynamoAudit');
let { convertToOldModel } = require('modules/data-access/lbUpstreamAdapter');
let loadBalancerUpstreams = require('modules/data-access/loadBalancerUpstreams');
let { getMetadataForDynamoAudit } = require('api/api-utils/requestMetadata');
let dynamoHelper = new (require('api/api-utils/DynamoHelper'))(RESOURCE);
let param = require('api/api-utils/requestParam');
let { getAccountNameForEnvironment } = require('models/Environment');
let co = require('co');

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/upstreams
 */
function getUpstreamsConfig(req, res, next) {
  const environment = param('environment', req);
  const queryAttribute = param('qa', req);
  const queryValues = param('qv', req);

  function get(attribute, value) {
    return (() => {
      switch (attribute) {
        case 'environment':
          return loadBalancerUpstreams.inEnvironment(value);
        case 'load-balancer-group':
          return loadBalancerUpstreams.inLoadBalancerGroup(value);
        default:
          return loadBalancerUpstreams.scan();
      }
    })().then(({ Items }) => Items);
  }

  return (() => {
    if (environment) {
      return get('environment', environment);
    } else if (queryAttribute && queryValues) {
      return Promise.map(queryValues, value => get(queryAttribute, value)).then(flatten);
    } else {
      return get();
    }
  })()
    .then(map(flow(convertToOldModel, convertToApiModel)))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * GET /config/upstreams/{name}
 */
function getUpstreamConfigByName(req, res, next) {
  let Key = param('name', req);
  return loadBalancerUpstreams.get({ Key })
    .then(flow(convertToOldModel, convertToApiModel))
    .then(data => res.json(data))
    .catch(next);
}

/**
 * POST /config/upstreams
 */
function postUpstreamsConfig(req, res, next) {
  let body = req.swagger.params.body.value;
  let user = req.user;
  let key = body.key;
  let environmentName = body.Value.EnvironmentName;

  co(function* () {
    let accountName = yield getAccountNameForEnvironment(environmentName);
    return dynamoHelper.create(key, { Value: body.Value }, user, { accountName });
  }).then(data => res.json(data)).catch(next);
}

/**
 * PUT /config/upstreams/{name}
 */
function putUpstreamConfigByName(req, res, next) {
  let body = req.swagger.params.body.value;
  let key = req.swagger.params.name.value;
  let expectedVersion = req.swagger.params['expected-version'].value;
  let user = req.user;
  let environmentName = body.EnvironmentName;

  co(function* () {
    let accountName = yield getAccountNameForEnvironment(environmentName);
    return dynamoHelper.update(key, { Value: body }, expectedVersion, user, { accountName });
  }).then(data => res.json(data)).catch(next);
}

/**
 * DELETE /config/upstreams/{name}
 */
function deleteUpstreamConfigByName(req, res, next) {
  let Key = param('name', req);
  let key = { Key };
  const expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);

  return loadBalancerUpstreams.delete({ key, metadata }, expectedVersion)
    .then(() => res.status(200).end());
}

module.exports = {
  getUpstreamsConfig,
  getUpstreamConfigByName,
  postUpstreamsConfig,
  putUpstreamConfigByName,
  deleteUpstreamConfigByName
};
