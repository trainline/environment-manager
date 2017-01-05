/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let config = require('config');

let _configuration;

module.exports = {
  getLoginUrl: () => {
    loadConfiguration();
    return _configuration.loginUrl;
  },

  getCookieName: () => {
    loadConfiguration();
    return _configuration.cookieName;
  },

  getCookieDuration: () => {
    loadConfiguration();
    return _configuration.cookieDuration;
  },
};

function loadConfiguration() {
  let localConfig = config.getUserValue('local');

  assert(localConfig.authentication, `missing 'authentication' field in configuration`);
  assert(localConfig.authentication.loginUrl, `missing 'authentication.loginUrl' field in configuration`);
  assert(localConfig.authentication.cookieName, `missing 'authentication.cookieName' field in configuration`);
  assert(localConfig.authentication.cookieDuration, `missing 'authentication.cookieDuration' field in configuration`);

  _configuration = {
    loginUrl: localConfig.authentication.loginUrl,
    cookieName: localConfig.authentication.cookieName,
    cookieDuration: localConfig.authentication.cookieDuration,
  };
}
