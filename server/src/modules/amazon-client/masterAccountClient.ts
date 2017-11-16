/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

import * as AWS from 'aws-sdk';

module.exports = {
  createLowLevelDynamoClient: () => Promise.resolve(new AWS.DynamoDB()),
  createDynamoClient: () => Promise.resolve(new AWS.DynamoDB.DocumentClient()),
  createASGClient: () => Promise.resolve(new AWS.AutoScaling()),
  createEC2Client: () => Promise.resolve(new AWS.EC2()),
  createIAMClient: () => Promise.resolve(new AWS.IAM()),
  createS3Client: () => Promise.resolve(new AWS.S3()),
  createSNSClient: () => Promise.resolve(new AWS.SNS())
};
