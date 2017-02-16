/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let AWS = require('aws-sdk');
let common = require('./common');

module.exports = {
  createLowLevelDynamoClient: _ => common.create(AWS.DynamoDB, common.getOptions()),
  createDynamoClient: _ => common.create(AWS.DynamoDB.DocumentClient, common.getOptions()),
  createASGClient: () => common.create(AWS.AutoScaling, common.getOptions()),
  createEC2Client: () => common.create(AWS.EC2, common.getOptions()),
  createIAMClient: () => common.create(AWS.IAM, common.getOptions()),
  createS3Client: () => common.create(AWS.S3, common.getOptions()),
  createSNSClient: () => common.create(AWS.SNS, common.getOptions())
};
