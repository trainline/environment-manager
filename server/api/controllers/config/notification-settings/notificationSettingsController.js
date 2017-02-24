/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let notificationSettings = require('modules/data-access/notificationSettings');
let getMetadataForDynamoAudit = require('api/api-utils/requestMetadata').getMetadataForDynamoAudit;
let param = require('api/api-utils/requestParam');
let versionOf = require('modules/data-access/dynamoVersion').versionOf;
let removeAuditMetadata = require('modules/data-access/dynamoAudit').removeAuditMetadata;

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

/**
 * GET /config/notification-settings
 */
function getAllNotificationSettings(req, res, next) {
  return notificationSettings.scan()
    .then(data => data.map(convertToApiModel))
    .then(data => res.json(data)).catch(next);
}

/**
 * GET /config/notification-settings/{id}
 */
function getNotificationSettingsById(req, res, next) {
  let key = {
    NotificationSettingsId: param('id', req)
  };
  return notificationSettings.get(key)
    .then(convertToApiModel)
    .then(data => res.json(data)).catch(next);
}

/**
 * POST /config/notification-settings
 */
function postNotificationSettings(req, res, next) {
  let body = param('body', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, body);
  delete record.Version;
  return notificationSettings.create({ record, metadata }).then(data => res.json(data)).catch(next);
}

/**
 * PUT /config/notification-settings/{id}
 */
function putNotificationSettingsById(req, res, next) {
  let key = {
    NotificationSettingsId: param('id', req)
  };
  let body = param('body', req);
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);
  let record = Object.assign({}, key, { Value: body });
  delete record.Version;
  return notificationSettings.replace({ record, metadata }, expectedVersion).then(data => res.json(data)).catch(next);
}

/**
 * DELETE /config/notification-settings/{id}
 */
function deleteNotificationSettingsById(req, res, next) {
  let key = {
    NotificationSettingsId: param('id', req)
  };
  let expectedVersion = param('expected-version', req);
  let metadata = getMetadataForDynamoAudit(req);
  return notificationSettings.delete({ key, metadata }, expectedVersion).then(data => res.json(data)).catch(next);
}

module.exports = {
  getAllNotificationSettings,
  getNotificationSettingsById,
  postNotificationSettings,
  putNotificationSettingsById,
  deleteNotificationSettingsById
};
