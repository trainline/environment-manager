/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const RESOURCE = 'config/permissions';
let dynamoHelper = new (require('api/api-utils/DynamoHelper'))(RESOURCE);

/**
 * GET /config/permissions
 */
function getPermissionsConfig(req, res, next) {
  return dynamoHelper.getAll().then(data => res.json(data)).catch(next);
}

/**
 * GET /config/permissions/{name}
 */
function getPermissionConfigByName(req, res, next) {
  let key = req.swagger.params.name.value;
  return dynamoHelper.getByKey(key).then(data => res.json(data)).catch(next);
}

/**
 * POST /config/permissions
 */
function postPermissionsConfig(req, res, next) {
  let body = req.swagger.params.body.value;
  let user = req.user;
  let key = body.Name;

  return dynamoHelper.create(key, { Permissions: body.Permissions }, user).then(data => res.json(data)).catch(next);
}

/**
 * PUT /config/permissions/{name}
 */
function putPermissionConfigByName(req, res, next) {
  let body = req.body; // Swagger bug? when req.body = [ 'a' ], req.swagger.params.body = [ [ 'a '] ]
  let key = req.swagger.params.name.value
  let expectedVersion = req.swagger.params['expected-version'].value;
  let user = req.user;

  return dynamoHelper.update(key, { Permissions: body }, expectedVersion, user).then(data => res.json(data)).catch(next);
}

/**
 * DELETE /config/permissions/{name}
 */
function deletePermissionConfigByName(req, res, next) {
  let key = req.swagger.params.name.value
  let user = req.user;
  return dynamoHelper.delete(key, user).then(data => res.json(data)).catch(next);
}

module.exports = {
  getPermissionsConfig,
  getPermissionConfigByName,
  postPermissionsConfig,
  putPermissionConfigByName,
  deletePermissionConfigByName
};
