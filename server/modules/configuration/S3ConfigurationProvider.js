/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let masterAccountClient = require('modules/amazon-client/masterAccountClient');
let config = require('config');

const S3_BUCKET = config.get('EM_AWS_S3_BUCKET');
const S3_KEY = config.get('EM_AWS_S3_KEY');

module.exports = function S3ConfigurationProvider() {
  this.get = function getConfigurationFromS3() {
    let parameters = {
      Bucket: S3_BUCKET,
      Key: S3_KEY
    };

    return masterAccountClient
      .createS3Client()
      .then(client => client.getObject(parameters).promise())
      .then(object => JSON.parse(object.Body.toString('utf8')));
  };
};
