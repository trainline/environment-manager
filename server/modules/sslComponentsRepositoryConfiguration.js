/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let config = require('config');

module.exports = function SSLComponentsRepositoryConfiguration() {

  var configuration = loadConfiguration();

  this.getBucketName = () => configuration.bucketName;
  this.getPrivateKeyObjectPath = () => configuration.privateKeyObjectPath;
  this.getCertificateObjectPath = () => configuration.certificateObjectPath;

  function loadConfiguration() {
    let localConfig = config.getUserValue('local');

    assert(localConfig.server, `missing 'server' field in configuration`);
    assert(localConfig.server.ssl, `missing 'server.ssl' field in configuration`);
    assert(localConfig.server.ssl.S3, `missing 'server.ssl.S3' field in configuration`);
    assert(localConfig.server.ssl.S3.bucket, `missing 'server.ssl.S3.bucket' field in configuration`);
    assert(localConfig.server.ssl.S3.key, `missing 'server.ssl.S3.key' field in configuration`);
    assert(localConfig.server.ssl.S3.cert, `missing 'server.ssl.S3.cert' field in configuration`);

    return {
      bucketName: localConfig.server.ssl.S3.bucket,
      privateKeyObjectPath: localConfig.server.ssl.S3.key,
      certificateObjectPath: localConfig.server.ssl.S3.cert,
    };
  }

};
