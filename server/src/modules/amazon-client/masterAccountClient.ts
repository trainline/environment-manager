"use strict";

import * as AWS from "aws-sdk";

module.exports = {
  createASGClient: () => Promise.resolve(new AWS.AutoScaling()),
  createDynamoClient: () => Promise.resolve(new AWS.DynamoDB.DocumentClient()),
  createEC2Client: () => Promise.resolve(new AWS.EC2()),
  createIAMClient: () => Promise.resolve(new AWS.IAM()),
  createLowLevelDynamoClient: () => Promise.resolve(new AWS.DynamoDB()),
  createS3Client: () => Promise.resolve(new AWS.S3()),
  createSNSClient: () => Promise.resolve(new AWS.SNS()),
};
