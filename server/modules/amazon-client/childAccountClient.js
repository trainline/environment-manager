/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let guid = require('uuid/v1');
let AWS = require('aws-sdk');
let awsAccounts = require('modules/awsAccounts');

module.exports = {
  createLowLevelDynamoClient: createClientWithRole(AWS.DynamoDB),
  createDynamoClient: createClientWithRole(AWS.DynamoDB.DocumentClient),
  createASGClient: createClientWithRole(AWS.AutoScaling),
  createEC2Client: createClientWithRole(AWS.EC2),
  createIAMClient: createClientWithRole(AWS.IAM),
  createS3Client: createClientWithRole(AWS.S3),
  createSNSClient: createClientWithRole(AWS.SNS),
  assumeRole
};

function createClientWithRole(ClientType) {
  return accountName =>
    awsAccounts.getByName(accountName)
      .then(({ Impersonate, RoleArn }) => (Impersonate && RoleArn !== undefined
        ? getCredentials(RoleArn).then(credentials => ({ credentials }))
        : Promise.resolve({})))
      .then(options => new ClientType(options));
}

function getCredentials(roleARN) {
  return assumeRole(roleARN).then(response =>
    new AWS.Credentials(
      response.Credentials.AccessKeyId,
      response.Credentials.SecretAccessKey,
      response.Credentials.SessionToken
    )
  );
}

function assumeRole(roleARN) {
  let stsClient = new AWS.STS();
  let stsParameters = {
    RoleArn: roleARN,
    RoleSessionName: guid()
  };

  return stsClient.assumeRole(stsParameters).promise();
}
