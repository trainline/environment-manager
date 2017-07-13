/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let _ = require('lodash');
let AWS = require('aws-sdk');

function getHostAccountId() {
  return co(function*() {
    var iam = new AWS.IAM();
    let accountId = yield iam.getUser({}).promise()
      .then(data => data.User.Arn.split(':')[4])
      .catch(err => null);
    
    if (!accountId) {
      var metadata = new AWS.MetadataService();
      let iamInfo = yield metadata.request('/latest/meta-data/iam/info').promise();
      accountId = JSON.parse(iamInfo).InstanceProfileArn.split(':')[4];
    }

    return Number(accountId);
  });
}

function getMasterAccount() {
  return co(function*() {
    let hostAccountId = yield getHostAccountId();
    return {
      AccountName: 'Master',
      AccountNumber: hostAccountId,
      Impersonate: false,
      IsMaster: true,
      IsProd: true
    };
  });
}

module.exports = _.memoize(getMasterAccount);
