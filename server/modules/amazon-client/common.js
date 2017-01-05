/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const AWS_REGION = require('config').get('EM_AWS_REGION');
const MAX_FREE_SOCKETS = 25;
const SECURE_PROTOCOL = 'TLSv1_method';
const HTTPS_CIPHERS = 'ALL';

let https = require('https');
let AWS = require('aws-sdk');
let httpsAgent = null;

AWS.config.setPromisesDependency(require('bluebird'));

function create(ClientType, options) {
  let client = new ClientType(options);
  return Promise.resolve(client);
}

function getOptions() {
  return {
    credentials: undefined,
    region: AWS_REGION,
    httpOptions: {
      agent: getHttpsAgent(),
    },
  };
}

function getHttpsAgent() {
  if (!httpsAgent) {
    // AWS-SDK issue: https://github.com/aws/aws-sdk-js/issues/862
    httpsAgent = new https.Agent({
      rejectUnauthorized: true,
      keepAlive: true,
      secureProtocol: SECURE_PROTOCOL,
      ciphers: HTTPS_CIPHERS,
      maxFreeSockets: MAX_FREE_SOCKETS,
    });
  }
  return httpsAgent;
}

module.exports = {
  create,
  getOptions,
};
