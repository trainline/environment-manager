/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('config/');
let LocalConfigurationProvider = require('./LocalConfigurationProvider');
let S3ConfigurationProvider = require('./S3ConfigurationProvider');
let awsAccounts = require('modules/awsAccounts');
let masterAccountClient = require('modules/amazon-client/masterAccountClient');

const EM_REDIS_CRYPTO_KEY_S3_BUCKET = config.get('EM_REDIS_CRYPTO_KEY_S3_BUCKET');
const EM_REDIS_CRYPTO_KEY_S3_KEY = config.get('EM_REDIS_CRYPTO_KEY_S3_KEY');

function getRedisEncryptionKey() {
  if (EM_REDIS_CRYPTO_KEY_S3_BUCKET && EM_REDIS_CRYPTO_KEY_S3_KEY) {
    return masterAccountClient.createS3Client().then(s3 => s3.getObject({
      Bucket: EM_REDIS_CRYPTO_KEY_S3_BUCKET,
      Key: EM_REDIS_CRYPTO_KEY_S3_KEY,
    }).promise()).then(rsp => rsp.Body);
  } else {
    return Promise.resolve();
  }
}
module.exports = function ConfigurationProvider() {
  this.init = function () {
    let configurationProvider;
    if (config.get('IS_PRODUCTION')) {
      configurationProvider = new S3ConfigurationProvider();
    } else {
      configurationProvider = new LocalConfigurationProvider();
    }

    function loadConfiguration() {
      configurationProvider.get().then(configuration => config.setUserValue('local', configuration));
    }

    function loadRedisEncryptionKey() {
      getRedisEncryptionKey().then((key) => {
        if (!config.get('EM_REDIS_CRYPTO_KEY')) {
          config.set('EM_REDIS_CRYPTO_KEY', key);
        }
      });
    }

    return awsAccounts.getMasterAccount()
      .then(account => config.setUserValue('masterAccountName', account.AccountName))
      .then(() => Promise.all([loadConfiguration(), loadRedisEncryptionKey()]));
  };
};
