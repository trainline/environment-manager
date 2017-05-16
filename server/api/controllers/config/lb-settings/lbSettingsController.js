/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let {
  getLBSettingsConfig,
  getLBSettingConfigByName
} = require('api/api-utils/lbSettingsControllerCrossAccount');

let {
  deleteLBSettingConfigByName,
  postLBSettingsConfig,
  putLBSettingConfigByName
} = require('api/api-utils/lbSettingsController');

module.exports = {
  getLBSettingsConfig,
  getLBSettingConfigByName,
  postLBSettingsConfig,
  putLBSettingConfigByName,
  deleteLBSettingConfigByName
};
