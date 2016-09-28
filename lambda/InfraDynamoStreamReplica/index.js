/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const AWS = require('aws-sdk');
const tableRegex = /arn:aws:dynamodb:[\w-]+:\d+:table\/([^\/]+)\/stream\/[\w-:\.]+/;
const DESTINATION_ACCOUNTS = // Assign an array of all your Environment Manager slave accounts here.

/* This function returns a promise of the configuration required
 * to run this function. The current implementation just returns
 * a constant but a DynamoDB or S3 lookup would be easy. */
function getConfiguration(context) {
  return Promise.resolve({
    DestinationAccounts: DESTINATION_ACCOUNTS
  });
}

function getTableNameFromARN(arn) {
  var tableName = tableRegex.exec(arn)[1];
  return tableName;
}

function getIAMRoleInTargetAccount(accountNumber) {
  var arn = "arn:aws:iam::" + accountNumber + ":role/roleInfraDynamoStreamReplicaWriter"
  return arn;
}

function createReplicateRequest(record) {
    let request = {
        TableName: getTableNameFromARN(record.eventSourceARN)
    };
    if (record.eventName === 'REMOVE') {
        request.Key = record.dynamodb.Keys;
        return {
            operation: 'deleteItem',
            params: request
        };
    } else {
        request.Item = record.dynamodb.NewImage;
        return {
            operation: 'putItem',
            params: request
        };
    }
}

function buildTasksForEachRecord(records, dynamoClient) {
    let requests = records.map(createReplicateRequest);
    //console.log(requests);
    let tasks = requests.map(function (request) {
        return dynamoClient[request.operation](request.params).promise();
  });

  return tasks;
}

function replicateRecordsToAccount(records, accountNumber) {

  console.log('Replicating records to %d AWS account', accountNumber);

  function assumeRole() {
    let stsClient = new AWS.STS();
    let stsParams = {
      RoleArn: getIAMRoleInTargetAccount(accountNumber),
      RoleSessionName: '' + new Date().getTime()
    };
    return stsClient.assumeRole(stsParams).promise();
  }

  function createDynamoClientWithAssumedRole(stsResponse) {
    let credentials = new AWS.Credentials(
      stsResponse.Credentials.AccessKeyId,
      stsResponse.Credentials.SecretAccessKey,
      stsResponse.Credentials.SessionToken
    );
    return new AWS.DynamoDB({ credentials: credentials });
  }

  function writeEachRecord(dynamoClient) {
    let tasks = buildTasksForEachRecord(records, dynamoClient);
    return Promise.all(tasks);
  }

  return assumeRole()
    .then(createDynamoClientWithAssumedRole)
    .then(writeEachRecord);
}

exports.handler = function (event, context) {
  let records = event.Records;
  console.log('Received %d records from dynamo streams', records.length);

  function main(config) {
    let accounts = config.DestinationAccounts;
    let tasks = accounts.map(account => replicateRecordsToAccount(records, account).catch(error => {
      error.message = `Error writing to account ${account}: ${error.message}`
      console.error(error);
      return error;
    }));

    return Promise.all(tasks)
      .then(ts => ts.some(t => t instanceof Error) ? Promise.reject(new Error('Failed to write to one or more accounts.')) : Promise.resolve());
  }

  return getConfiguration(context).then(main).then(context.succeed, context.fail);
};