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
  const key = req.swagger.params.name.value;
  return dynamoHelper.getByKey(key).then(data => res.json(data)).catch(next);
}

/**
 * POST /config/permissions
 */
function postPermissionsConfig(req, res, next) {
  const body = req.swagger.params.body.value;
  const user = req.user;
  const key = body.Name;

  return dynamoHelper.create({ Permissions: body.Permissions }, key, user).then(data => res.json(data)).catch(next);
}

/**
 * PUT /config/permissions/{name}
 */
function putPermissionConfigByName(req, res, next) {
  const body = req.swagger.params.body.value;
  const key = req.swagger.params.name.value
  const expectedVersion = req.swagger.params['expected-version'].value;
  const user = req.user;

  return dynamoHelper.update({ Permissions: body }, key, expectedVersion, user).then(data => res.json(data)).catch(next);
}

/**
 * DELETE /config/permissions/{name}
 */
function deletePermissionConfigByName(req, res, next) {
  res.json();
}

module.exports = {
  getPermissionsConfig,
  getPermissionConfigByName,
  postPermissionsConfig,
  putPermissionConfigByName,
  deletePermissionConfigByName
};
