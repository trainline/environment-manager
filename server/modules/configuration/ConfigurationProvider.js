'use strict';

let config = require('config/');
let fs = require('fs');
let LocalConfigurationProvider = require('./LocalConfigurationProvider');
let S3ConfigurationProvider = require('./S3ConfigurationProvider');
let awsAccounts = require('modules/awsAccounts');

module.exports = function ConfigurationProvider() {
  this.init = function () {
    let configurationProvider;
    if (config.get('IS_PRODUCTION')) {
      configurationProvider = new S3ConfigurationProvider();
    } else {
      configurationProvider = new LocalConfigurationProvider();
    }

    return awsAccounts.getMasterAccount()
      .then(account => config.setUserValue('masterAccountName', account.AccountName))
      .then(configurationProvider.get)
      .then(configuration => config.setUserValue('local', configuration));
  };
};
