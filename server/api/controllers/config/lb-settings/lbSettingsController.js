/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const RESOURCE = 'config/lbsettings';
const PARTITION_KEY = 'EnvironmentName';
const SORT_KEY = 'VHostName';

let co = require('co');
let dynamoHelper = new (require('api/api-utils/DynamoHelper'))(RESOURCE);
let Environment = require('models/Environment');

/**
 * GET /config/lb-settings
 */
function getLBSettingsConfig(req, res, next) {
  return dynamoHelper.getAllCrossAccount().then(data => res.json(data)).catch(next);
}

/**
 * GET /config/lb-settings/{environment}/{vHostName}
 */
function getLBSettingConfigByName(req, res, next) {
  const key = req.swagger.params.environment.value;
  const range = req.swagger.params.vHostName.value;
  co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(key);
    return dynamoHelper.getBySortKey(key, range, { accountName })
  }).then(data => res.json(data)).catch(next);
}

/**
 * POST /config/lb-settings
 */
function postLBSettingsConfig(req, res, next) {
  const value = req.swagger.params.body.value;
  const environmentName = value[PARTITION_KEY];
  const vHostName = value[SORT_KEY];
  const user = req.user;

  co(function* () {
    let environmentName = value.EnvironmentName;
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    return dynamoHelper.createWithSortKey(environmentName, vHostName, { Value: value }, user, { accountName });
  }).then(_ => res.status(201).end()).catch(next);
}

/**
 * PUT /config/lb-settings/{environment}/{vHostName}
 */
function putLBSettingConfigByName(req, res, next) {
  const value = req.swagger.params.body.value;
  const environmentName = req.swagger.params.environment.value;
  const vHostName = req.swagger.params.vHostName.value;
  const expectedVersion = req.swagger.params['expected-version'].value;
  const user = req.user;

  co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    return dynamoHelper.updateWithSortKey(environmentName, vHostName, value, expectedVersion, user, { accountName });
  }).then(_ => res.status(200).end()).catch(next);
}

/**
 * DELETE /config/lb-settings/{environment}/{vHostName}
 */
function deleteLBSettingConfigByName(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const vHostName = req.swagger.params.vHostName.value;
  const user = req.user;

  co(function* () {
    let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    return dynamoHelper.deleteWithSortKey(environmentName, vHostName, user , { accountName });
  }).then(_ => res.status(200).end()).catch(next);
}

module.exports = {
  getLBSettingsConfig,
  getLBSettingConfigByName,
  postLBSettingsConfig,
  putLBSettingConfigByName,
  deleteLBSettingConfigByName
};
