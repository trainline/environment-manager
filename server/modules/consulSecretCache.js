/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let awsMasterClient = require('modules/amazon-client/masterAccountClient');
let cacheManager = require('modules/cacheManager');
let logger = require('modules/logger');

const TTL = 10 * 60 // seconds

cacheManager.create('ConsulToken', createToken, { stdTTL: TTL });

/**
 * retrieve a ConsulToken
 * @param {s3Location} s3Location - the S3 bucket and key
 */
function getToken(s3Location) {
  let cacheKey = JSON.stringify(s3Location);
  return cacheManager.get('ConsulToken').get(cacheKey);
}

function createToken(cacheKey) {
  let query = Object.assign({}, JSON.parse(cacheKey));
  return awsMasterClient.createS3Client()
    .then(client => client.getObject(query).promise())
    .then(response => JSON.parse(response.Body.toString('utf8')))
    .catch((error) => {
      logger.error(`Failed to get Consul token from ${cacheKey}`);
      return Promise.reject(error);
    });
}

module.exports = {
  get: getToken
};
