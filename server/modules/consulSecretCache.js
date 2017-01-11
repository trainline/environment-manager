/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let awsMasterClient = require('modules/amazon-client/masterAccountClient');
let cacheManager = require('modules/cacheManager');

cacheManager.create('ConsulToken', createToken, { stdTTL: 10 });

/**
 * retrieve a ConsulToken
 * @param {s3Location} s3Location - the S3 bucket and key
 */
function getToken(s3Location) {
  let cacheKey = JSON.stringify(s3Location);
  return cacheManager.get('ConsulToken').get(cacheKey)
    .then((response) => {
      let buffer = response.Body;
      let str = buffer.toString('utf8');
      return JSON.parse(str);
    });
}

function createToken(cacheKey) {
  let query = Object.assign({}, JSON.parse(cacheKey));
  return awsMasterClient.createS3Client().then(client => client.getObject(query).promise());
}

module.exports = {
  get: getToken,
};
