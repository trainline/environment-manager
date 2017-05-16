'use strict';

let AWS = require('aws-sdk');

function show(x) {
  return JSON.stringify(x);
}

function reduceSeq(fn, [x, ...xs], acc) {
  return x === undefined
    ? Promise.resolve(acc)
    : Promise.resolve(acc)
      .then(a => Promise.resolve(fn(a, x)))
      .then(a => reduceSeq(fn, xs, a));
}

function mapSeq(fn, array) {
  return reduceSeq((acc, nxt) => Promise.resolve(fn(nxt)).then(x => [...acc, x]), array, []);
}

function memoize(fn) {
  let memo = new Map();
  return (...args) => {
    let key = JSON.stringify(args);
    if (!memo.has(key)) {
      let result = fn(...args);
      memo.set(key, result);
    }
    return memo.get(key);
  };
}

function convertToOldModel(item) {
  return Object.assign({ readonly: { BOOL: true } }, item);
}

function parseFunctionArn(functionArn) {
  let match = /^arn:aws:lambda:([^:]+):([^:]+):function:(.*)/.exec(functionArn);
  if (match !== null && match.length > 1) {
    return {
      region: match[1],
      accountId: match[2],
      functionName: match[3]
    };
  }
  throw new Error('Could not determine AWS account from context object.');
}

exports.convertToOldModel = convertToOldModel;
exports.handler = (event, context, callback) => {

  const DESTINATION_TABLE = process.env.DESTINATION_TABLE;
  const ROLE_NAME = process.env.ROLE_NAME;

  const {
        accountId: myAccountId,
        functionName
    } = parseFunctionArn(context.invokedFunctionArn);

  let getCredentialsForAccount = memoize((accountId) => {
    if (accountId === myAccountId) {
      return Promise.resolve({});
    }
    let sts = new AWS.STS();
    let params = {
      RoleArn: `arn:aws:iam::${accountId}:role/${ROLE_NAME}`,
      RoleSessionName: functionName,
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
  });

  function deleteRecord(record) {
    console.log(`DELETE ${show(record.dynamodb.Keys)}`);
    return Promise.resolve()
      .then(() => getCredentialsForAccount(record.dynamodb.OldImage.AccountId.S))
      .then(credentials => new AWS.DynamoDB(credentials))
      .then(dynamo => {
        let params = {
          Key: {
            key: record.dynamodb.Keys.Key
          },
          TableName: DESTINATION_TABLE
        }
        return dynamo.deleteItem(params).promise()
      })
      .catch(error => { console.error(`Error deleting record: ${record}`); return Promise.reject(error); });
  }

  function putRecord(record) {
    console.log(`PUT ${show(record.dynamodb.Keys)}`);
    return Promise.resolve()
      .then(() => getCredentialsForAccount(record.dynamodb.NewImage.AccountId.S))
      .then(credentials => new AWS.DynamoDB(credentials))
      .then(dynamo => dynamo.putItem({
        Item: convertToOldModel(record.dynamodb.NewImage),
        TableName: DESTINATION_TABLE,
        ConditionExpression: '#Audit.#Version < :version or attribute_not_exists(#hashKey)',
        ExpressionAttributeNames: {
          '#Audit': 'Audit',
          '#hashKey': 'EnvironmentName',
          '#Version': 'Version'
        },
        ExpressionAttributeValues: {
          ':version': record.dynamodb.NewImage.Audit.M.Version
        }
      }).promise().catch(error => (error.code === 'ConditionalCheckFailedException' ? Promise.resolve() : Promise.reject(error))))
      .catch(error => { console.error(`Error putting record: ${record}`); return Promise.reject(error); });
  }

  function processRecord(record) {
    let { eventName } = record;
    switch (eventName) {
      case 'INSERT':
      case 'MODIFY':
        return putRecord(record).then(() => ({ PUT: record.dynamodb.Keys }));
      case 'REMOVE':
        return deleteRecord(record).then(() => ({ DELETE: record.dynamodb.Keys }));
      default:
        return Promise.reject(`Unsupported eventName: ${eventName}`);
    }
  }

  Promise.resolve()
    .then(mapSeq(processRecord, event.Records))
    .then(data => callback(null, data))
    .catch(error => callback(error));
};