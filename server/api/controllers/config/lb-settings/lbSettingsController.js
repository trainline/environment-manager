/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const RESOURCE = 'config/lbsettings';
const PARTITION_KEY = 'EnvironmentName';
const SORT_KEY = 'VHostName';

let dynamoHelper = new (require('api/api-utils/DynamoHelper'))(RESOURCE);

/**
 * GET /config/lb-settings
 */
function getLBSettingsConfig(req, res, next) {
  return dynamoHelper.getAll().then(data => res.json(data)).catch(next);
}

/**
 * GET /config/lb-settings/{environment}/{vHostName}
 */
function getLBSettingConfigByName(req, res, next) {
  const key = req.swagger.params.environment.value;
  const range = req.swagger.params.vHostName.value;
  return dynamoHelper.getBySortKey(key, range).then(data => res.json(data)).catch(next);
}

/**
 * POST /config/lb-settings
 */
function postLBSettingsConfig(req, res, next) {
  const value = req.swagger.params.body.value;
  const pKey = value[PARTITION_KEY];
  const sKey = value[SORT_KEY];
  const user = req.user;

  return dynamoHelper.createWithSortKey(pKey, sKey, { Value: value }, user)
    .then(_ => res.status(201).end()).catch(next);
}

/**
 * PUT /config/lb-settings/{environment}/{vHostName}
 */
function putLBSettingConfigByName(req, res, next) {
  const value = req.swagger.params.body.value;
  const pKey = req.swagger.params.environment.value;
  const sKey = req.swagger.params.vHostName.value;
  const expectedVersion = req.swagger.params['expected-version'].value;
  const user = req.user;

  return dynamoHelper.updateWithSortKey(pKey, sKey, value, expectedVersion, user)
    .then(_ => res.status(200).end()).catch(next);
}

/**
 * DELETE /config/lb-settings/{environment}/{vHostName}
 */
function deleteLBSettingConfigByName(req, res, next) {
  const pKey = req.swagger.params.environment.value;
  const sKey = req.swagger.params.vHostName.value;
  const user = req.user;

  return dynamoHelper.deleteWithSortKey(pKey, sKey, user)
    .then(_ => res.status(200).end()).catch(next);
}

module.exports = {
  getLBSettingsConfig,
  getLBSettingConfigByName,
  postLBSettingsConfig,
  putLBSettingConfigByName,
  deleteLBSettingConfigByName
};
