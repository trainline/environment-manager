"use strict";

import * as AWS from "aws-sdk";
import * as guid from "uuid/v1";
import * as awsAccounts from "../awsAccounts";

const createLowLevelDynamoClient = createClientWithRole(AWS.DynamoDB);
const createDynamoClient = createClientWithRole(AWS.DynamoDB.DocumentClient);
const createASGClient = createClientWithRole(AWS.AutoScaling);
const createEC2Client = createClientWithRole(AWS.EC2);
const createIAMClient = createClientWithRole(AWS.IAM);
const createS3Client = createClientWithRole(AWS.S3);
const createSNSClient = createClientWithRole(AWS.SNS);

export {
  assumeRole,
  createLowLevelDynamoClient,
  createDynamoClient,
  createASGClient,
  createEC2Client,
  createIAMClient,
  createS3Client,
  createSNSClient,
};

function createClientWithRole<T>(ClientType: new (opts: {}) => T): (accountName: string) => Promise<T> {
  return (accountName) =>
    awsAccounts.getByName(accountName)
      .then(({ RoleArn }) => (getCredentials(RoleArn)))
      .then((credentials) => ({ credentials }))
      .then((options) => new ClientType(options));
}

function getCredentials(roleARN: string) {
  return assumeRole(roleARN).then(({ Credentials }) => {
    if (Credentials === undefined) {
      throw new Error("Credentials was undefined");
    }
    return new AWS.Credentials(
      Credentials.AccessKeyId,
      Credentials.SecretAccessKey,
      Credentials.SessionToken,
    );
  });
}

function assumeRole(roleARN: string) {
  const stsClient = new AWS.STS();
  const stsParameters = {
    RoleArn: roleARN,
    RoleSessionName: guid(),
  };

  return stsClient.assumeRole(stsParameters).promise();
}
