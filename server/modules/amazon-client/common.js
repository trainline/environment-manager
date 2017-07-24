/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const AWS_REGION = require('config').get('EM_AWS_REGION');
const MAX_FREE_SOCKETS = 25;
const SECURE_PROTOCOL = 'TLSv1_method';
const HTTPS_CIPHERS = 'ALL';

let AWS = require('aws-sdk');

AWS.config.setPromisesDependency(require('bluebird'));

function create(ClientType, options) {
  let client = new ClientType(options);
  return Promise.resolve(client);
}

function getOptions() {
  return {
    credentials: undefined,
    region: AWS_REGION
  };
}

module.exports = {
  create,
  getOptions
};
