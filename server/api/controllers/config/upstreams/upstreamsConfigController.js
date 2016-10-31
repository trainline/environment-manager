/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const RESOURCE = 'config/lbupstream';
let dynamoHelper = new (require('api/api-utils/DynamoHelper'))(RESOURCE);

/**
 * GET /config/upstreams
 */
function getUpstreamsConfig(req, res, next) {
  return dynamoHelper.getAllCrossAccount().then(data => res.json(data)).catch(next);
}

/**
 * GET /config/upstreams/{name}
 */
function getUpstreamConfigByName(req, res, next) {
  let key = req.swagger.params.name.value;
  return dynamoHelper.getByKey(key).then(data => res.json(data)).catch(next);
}


/**
 * POST /config/upstreams
 */
function postUpstreamsConfig(req, res, next) {
  let body = req.swagger.params.body.value;
  let user = req.user;
  let key = body.key;

  return dynamoHelper.create(key, { Value: body.Value }, user).then(data => res.json(data)).catch(next);
}

/**
 * PUT /config/upstreams/{name}
 */
function putUpstreamConfigByName(req, res, next) {
  let body = req.swagger.params.body.value;
  let key = req.swagger.params.name.value
  let expectedVersion = req.swagger.params['expected-version'].value;
  let user = req.user;

  return dynamoHelper.update(key, { Value: body }, expectedVersion, user).then(data => res.json(data)).catch(next);
}

/**
 * DELETE /config/upstreams/{name}
 */
function deleteUpstreamConfigByName(req, res, next) {
  let key = req.swagger.params.name.value
  let user = req.user;
  return dynamoHelper.delete(key, user).then(data => res.json(data)).catch(next);
}

module.exports = {
  getUpstreamsConfig,
  getUpstreamConfigByName,
  postUpstreamsConfig,
  putUpstreamConfigByName,
  deleteUpstreamConfigByName
};
