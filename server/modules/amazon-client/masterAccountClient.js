/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let AWS = require('aws-sdk');
let common = require('./common');

module.exports = {
  createDynamoClient: _ => common.create(AWS.DynamoDB.DocumentClient, common.getOptions()),
  createASGClient: _ => common.create(AWS.AutoScaling, common.getOptions()),
  createEC2Client: _ => common.create(AWS.EC2, common.getOptions()),
  createIAMClient: _ => common.create(AWS.IAM, common.getOptions()),
  createS3Client: _ => common.create(AWS.S3, common.getOptions()),
  createSNSClient: _ => common.create(AWS.SNS, common.getOptions()),
};
