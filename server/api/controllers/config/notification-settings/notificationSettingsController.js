/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const RESOURCE = 'config/notification-settings';
let dynamoHelper = new (require('api/api-utils/DynamoHelper'))(RESOURCE);

/**
 * GET /config/notification-settings
 */
function getAllNotificationSettings(req, res, next) {
  return dynamoHelper.getAll().then(data => res.json(data)).catch(next);
}

/**
 * GET /config/notification-settings/{name}
 */
function getNotificationSettingsByName(req, res, next) {
  let key = req.swagger.params.name.value;
  return dynamoHelper.getByKey(key).then(data => res.json(data)).catch(next);
}

/**
 * POST /config/notification-settings
 */
function postPermissionsConfig(req, res, next) {
  let body = req.swagger.params.body.value;
  let user = req.user;
  let key = body.Name;

  return dynamoHelper.create(key, { Permissions: body.Permissions }, user).then(data => res.json(data)).catch(next);
}

/**
 * PUT /config/notification-settings/{name}
 */
function putNotificationSettingsByName(req, res, next) {
  let body = req.swagger.params.body.value;
  let key = req.swagger.params.name.value
  let expectedVersion = req.swagger.params['expected-version'].value;
  let user = req.user;

  return dynamoHelper.update(key, { Permissions: body }, expectedVersion, user).then(data => res.json(data)).catch(next);
}

/**
 * DELETE /config/notification-settings/{name}
 */
function deleteNotificationSettingsByName(req, res, next) {
  let key = req.swagger.params.name.value
  let user = req.user;
  return dynamoHelper.delete(key, user).then(data => res.json(data)).catch(next);
}

module.exports = {
  getAllNotificationSettings,
  getNotificationSettingsByName,
  postNotificationSettings,
  putNotificationSettingsByName,
  deleteNotificationSettingsByName
};
