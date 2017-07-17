/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let _ = require('lodash');
let AWS = require('aws-sdk');

let logger = require('modules/logger');

function getHostAccount() {
  return co(function*() {
    var iam = new AWS.IAM();
    let accountId = yield iam.getUser({}).promise()
      .then(data => data.User.Arn.split(':')[4])
      .catch(err => {
        logger.warn(err);
        logger.warn('Unable to get host account details using iam.GetUser. Attempting to use EC2 metadata service...');
        return null;
      });
    
    if (!accountId) {
      var metadata = new AWS.MetadataService();
      let iamInfo = yield Promise.promisify(metadata.request)('/latest/meta-data/iam/info');
      accountId = JSON.parse(iamInfo).InstanceProfileArn.split(':')[4];
    }

    return {
      id: Number(accountId)
    };
  });
}

module.exports = _.memoize(getHostAccount);
