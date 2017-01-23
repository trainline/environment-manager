/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('config/');
let LocalConfigurationProvider = require('./LocalConfigurationProvider');
let S3ConfigurationProvider = require('./S3ConfigurationProvider');
let awsAccounts = require('modules/awsAccounts');
let logger = require('modules/logger');


module.exports = function ConfigurationProvider() {
  this.init = function () {
    let configurationProvider = (() => {
      if (config.get('IS_PRODUCTION')) {
        return new S3ConfigurationProvider();
      } else {
        return new LocalConfigurationProvider();
      }
    })();

    function loadConfiguration() {
      return configurationProvider.get()
        .then(configuration => config.setUserValue('local', configuration), logger.error.bind(logger));
    }

    return awsAccounts.getMasterAccount()
      .then(account => config.setUserValue('masterAccountName', account.AccountName))
      .then(loadConfiguration());
  };
};
