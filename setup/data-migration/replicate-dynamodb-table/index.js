/* eslint-disable no-console */

'use strict';

const AWS = require('aws-sdk');
const { env: {
  DESTINATION_TABLE
} } = require('process');

function delayP(t) {
  return new Promise(resolve => {
    setTimeout(resolve, t);
  });
}

function reduceP(fn, init, items) {
  function loop(promise, [head, ...tail]) {
    if (head === undefined) {
      return promise;
    }
    return loop(promise.then(acc => fn(acc, head)), tail);
  }
  return loop(Promise.resolve(init), items);
}

function mapSeqP(fn, items) {
  return reduceP(([...acc], nxt) => Promise.resolve(fn(nxt)).then(x => [...acc, x]), [], items);
}

function pick(propertyNames, obj = {}) {
  return propertyNames.reduce((acc, nxt) => Object.assign(acc, { [nxt]: obj[nxt] } ), {});
}

function logWithKey(key) {
  return (error) => {
    if (error.code === 'ConditionalCheckFailedException') {
      console.error(`Precondition failed. Skipping record: ${JSON.stringify(key)}`);
      return Promise.resolve();
    } else {
      console.error(`An error occurred processing the record: ${JSON.stringify(key)}`);
      return Promise.reject(error);
    }
  };
}

function write(dynamo, keyattrs, record) {
  let versionOf = ({ Audit: { M: { Version } = { } } = {} }) => Version;
  let { dynamodb: { Keys }, eventName } = record;
  let { dynamodb: { NewImage, OldImage } } = record;
  return (() => {
    if (eventName === 'INSERT' || eventName === 'MODIFY') {
      let [hashkey] = Object.keys(Keys);
      return dynamo.putItem({
        TableName: DESTINATION_TABLE,
        Item: NewImage,
        ConditionExpression: 'attribute_not_exists(#hashkey) or #Audit.#Version < :version',
        ExpressionAttributeNames: {
          '#Audit': 'Audit',
          '#hashkey': hashkey,
          '#Version': 'Version'
        },
        ExpressionAttributeValues: {
          ':version': versionOf(NewImage)
        }
      }).promise();
    } else if (eventName === 'REMOVE') {
      return dynamo.deleteItem({
        TableName: DESTINATION_TABLE,
        Key: pick(keyattrs, OldImage),
        ConditionExpression: '#Audit.#Version <= :version',
        ExpressionAttributeNames: {
          '#Audit': 'Audit',
          '#Version': 'Version'
        },
        ExpressionAttributeValues: {
          ':version': versionOf(OldImage)
        }
      }).promise();
    } else {
      return Promise.reject(`Unknown eventName: ${eventName}`);
    }
  })().catch(logWithKey(Keys));
}

let dynamo = new AWS.DynamoDB();
function handler(event, context, callback) {
  return dynamo.describeTable({ TableName: DESTINATION_TABLE }).promise()
    .then(({ Table: { KeySchema }}) => KeySchema.map(x => x.AttributeName))
    .then(keyattrs => mapSeqP(write.bind(null, dynamo, keyattrs), event.Records))
    .then(data => callback(null, data))
    .catch(error => callback(error));
}

module.exports = {
  delayP,
  handler,
  mapSeqP,
  reduceP,
  write
};
