'use strict';

let AWS = require('aws-sdk');

let dynamo = new AWS.DynamoDB.DocumentClient();

function show(x) {
  return JSON.stringify(x);
}

let { flatten } = (() => {
  function reduce(callback, initialValue, awsRequest) {
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }

    let accumulator = initialValue;
    return new Promise((resolve, reject) => {
      awsRequest.eachPage((error, data) => {
        if (error) {
          reject(error);
          return false;
        } else if (data === null) {
          resolve(accumulator);
          return false;
        } else {
          accumulator = callback(accumulator, data);
          return true;
        }
      });
    });
  }

  function flatten(callback, awsRequest) {
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function');
    }

    function extractAndConcatItems(accumulator, page) {
      let items = callback(page);
      if (Array.isArray(items)) {
        items.forEach(item => accumulator.push(item));
      } else {
        accumulator.push(items);
      }
      return accumulator;
    }

    return reduce(extractAndConcatItems, [], awsRequest);
  }

  return { flatten, reduce };
})();

function getEnvironmentTypeAndAccount(EnvironmentName) {
  return dynamo.get({
    TableName: 'c50-ConfigEnvironments',
    Key: { EnvironmentName },
    ProjectionExpression: '#EnvironmentName, #Value.#EnvironmentType',
    ExpressionAttributeNames: {
      '#EnvironmentName': 'EnvironmentName',
      '#EnvironmentType': 'EnvironmentType',
      '#Value': 'Value'
    }
  }).promise()
    .then(({ Item: { Value: { EnvironmentType } } }) => ({ EnvironmentName, EnvironmentType }))
    .then(({ EnvironmentType }) => dynamo.get({
      TableName: 'c50-ConfigEnvironmentTypes',
      Key: { EnvironmentType },
      ProjectionExpression: '#EnvironmentType, #Value.#AWSAccountNumber',
      ExpressionAttributeNames: {
        '#AWSAccountNumber': 'AWSAccountNumber',
        '#EnvironmentType': 'EnvironmentType',
        '#Value': 'Value'
      }
    }).promise().then(({ Item: { Value: { AWSAccountNumber } } }) => ({ AWSAccountNumber, EnvironmentName, EnvironmentType })));
}

function read(credentials, environmntName) {
  let reader = new AWS.DynamoDB.DocumentClient(credentials);
  let awsRequest = reader.scan({
    TableName: process.env.SOURCE_TABLE,
    FilterExpression: '#EnvironmentName = :environmntName and attribute_not_exists(#readonly) and (attribute_exists(#Audit.#Version) and attribute_type(#Audit.#Version, :t))',
    ExpressionAttributeNames: {
      '#Audit': 'Audit',
      '#EnvironmentName': 'EnvironmentName',
      '#readonly': 'readonly',
      '#Version': 'Version'
    },
    ExpressionAttributeValues: {
      ':environmntName': environmntName,
      ':t': 'N'
    },
    Limit: process.env.BATCH_SIZE
  });
  return flatten(({ Items }) => Items, awsRequest);
}

exports.handler = (event, context, callback) => {
  const ENVIRONMENT_NAME = process.env.ENVIRONMENT_NAME;
  const READER_ROLE_NAME = process.env.READER_ROLE_NAME;

  function getCredentials(roleArn) {
    let sts = new AWS.STS();
    let params = {
      RoleArn: roleArn,
      RoleSessionName: 'InfraEnvironmentManagerLbSettingsMover',
      DurationSeconds: 900
    };
    return sts.assumeRole(params).promise().then(({ Credentials: { AccessKeyId, SecretAccessKey, SessionToken } }) =>
      ({
        credentials: new AWS.Credentials({
          accessKeyId: AccessKeyId,
          secretAccessKey: SecretAccessKey,
          sessionToken: SessionToken
        })
      }));
  }

  function write(items) {
    let key = ({ EnvironmentName, VHostName}) => ({ EnvironmentName, VHostName});
    console.log(`Received ${items.length} records`);
    let writer = dynamo;
    function recur([x, ...xs]) {
      if (x === undefined) {
        return Promise.resolve();
      } else {
        return Promise.resolve()
          .then(() => writer.put({
            TableName: process.env.DESTINATION_TABLE,
            Item: x,
            ConditionExpression: 'attribute_not_exists(#EnvironmentName)',
            ExpressionAttributeNames: { '#EnvironmentName': 'EnvironmentName' }
          }).promise())
          .then(() => { console.log(`PUT ${show(key(x))}`); })
          .catch((error) => {
            if (error.code === 'ConditionalCheckFailedException') {
              console.log(`SKIP ${show(key(x))}`);
              return Promise.resolve();
            } else {
              console.log(`ERROR ${show(key(x))}`);
              console.log(JSON.stringify(x, null, 2));
              console.error(error);
              return Promise.reject(error);
            }
          })
          .then(recur(xs));
      }
    }
    return recur(items);
  }

  return getEnvironmentTypeAndAccount(ENVIRONMENT_NAME)
    .then(({ AWSAccountNumber, EnvironmentName, EnvironmentType }) =>
      getCredentials(`arn:aws:iam::${AWSAccountNumber}:role/${READER_ROLE_NAME}`)
        .then(credentials => read(credentials, EnvironmentName))
        .then(items => items.map((item) => {
          item.AccountId = AWSAccountNumber;
          item.LoadBalancerGroup = EnvironmentType;
          item.Audit.Version += 1;
          return item;
        }))
    )
    .then(write)
    .then(data => callback(null, data))
    .catch(error => callback(null, error));
};
