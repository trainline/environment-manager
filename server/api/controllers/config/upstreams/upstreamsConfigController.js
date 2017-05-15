/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const RESOURCE = 'config/lbupstream';
let { flow, pickBy } = require('lodash/fp');
let base64 = require('modules/base64');
let { versionOf } = require('modules/data-access/dynamoVersion');
let { removeAuditMetadata } = require('modules/data-access/dynamoAudit');
let { convertToOldModel } = require('modules/data-access/lbUpstreamAdapter');
let loadBalancerUpstreams = require('modules/data-access/loadBalancerUpstreams');
let { getMetadataForDynamoAudit } = require('api/api-utils/requestMetadata');
let dynamoHelper = new (require('api/api-utils/DynamoHelper'))(RESOURCE);
let param = require('api/api-utils/requestParam');
let { getAccountNameForEnvironment } = require('models/Environment');
let weblink = require('modules/weblink');
let co = require('co');
let querystring = require('querystring');

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
  const exclusiveStartKey = param('exclusiveStartKey', req);
  const loadBalancerGroup = param('loadBalancerGroup', req);
  const limit = param('per_page', req);
  const sort = param('sort', req);

  let opts = {
    ExclusiveStartKey: exclusiveStartKey ? base64.decode(exclusiveStartKey) : null,
    Limit: limit,
    ScanIndexForward: sort ? !sort.toUpperCase().startsWith('DESC') : true
  };

  function nextUrl(lastEvaluatedKey) {
    if (lastEvaluatedKey) {
      return flow(
        pickBy(value => value),
        querystring.stringify,
        q => [req.path, q].filter(x => x !== '').join('?')
      )({
        environment,
        exclusiveStartKey: base64.encode(lastEvaluatedKey),
        per_page: limit,
        sort: opts.ScanIndexForward ? 'asc' : 'desc'
      });
    } else {
      return null;
    }
  }

  function previousUrl([head]) {
    let keyOf = ({ Environment, Key }) => ({ Environment, Key });
    if (head && exclusiveStartKey) {
      return flow(
        pickBy(value => value),
        querystring.stringify,
        q => [req.path, q].filter(x => x !== '').join('?')
      )({
        environment,
        exclusiveStartKey: base64.encode(keyOf(head)),
        per_page: limit,
        sort: opts.ScanIndexForward ? 'desc' : 'asc'
      });
    } else {
      return null;
    }
  }

  let dbOperation = () => {
    if (environment) {
      return loadBalancerUpstreams.inEnvironment(environment, opts);
    } else if (loadBalancerGroup) {
      return loadBalancerUpstreams.inLoadBalancerGroup(loadBalancerGroup);
    } else {
      return loadBalancerUpstreams.scan();
    }
  };

  return dbOperation()
    .then(({ LastEvaluatedKey, Items }) => ({
      Items,
      Links: {
        next: nextUrl(LastEvaluatedKey),
        previous: previousUrl(Items)
      }
    }))
    .then((data) => {
      let linkHeader = flow(
        pickBy(x => x),
        weblink.link
      )(data.Links);
      res.header('Link', linkHeader);
      res.json(data.Items.map(flow(convertToOldModel, convertToApiModel)));
    })
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
