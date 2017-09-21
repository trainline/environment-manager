'use strict';

/* eslint no-console: 0 */

const AWS = require('aws-sdk');

// environment variables
// - TABLE_NAME : {string} representing the upstream config table name in this environment

exports.handler = (event, context) => {
  const dynamo = new AWS.DynamoDB({ apiVersion: '2012-08-10' });
  const TableName = process.env.TABLE_NAME;
  const ExpressionAttributeValues = {
    ':a': {
      BOOL: true
    }
  };
  const FilterExpression = 'MarkForDelete = :a';
  dynamo.scan({ TableName, FilterExpression, ExpressionAttributeValues }, (err, data) => {
    if (err) return handleError(err);
    else {
      data.Items.forEach((entry) => {
        const now = getUtcTimestampForNow();
        const params = {
          TableName,
          Key: { Key: { S: entry.Key.S } }
        };
        // The timestamp for deleting this item is in the past
        if (now > entry.MarkForDeleteTimestamp.N) {
          handleDeleteEntry(dynamo, params);
        } else {
          handleNoWork(entry);
        }
      });
    }
    return 0;
  });
};

function getUtcTimestampForNow() {
  return (new Date()).getTime();
}

function handleError(e) {
  console.error(e);
}

function handleSuccess(data) {
  console.info('Successfully deleted: ', JSON.stringify(data));
}

function handleDeleteEntry(dynamo, params) {
  dynamo.deleteItem(params, (err, data) => {
    if (err) handleError(err);
    else handleSuccess(data);
  });
}

function handleNoWork(entry) {
  console.info(`Entry ${entry.Key.S} timestamp is not in the past: ${entry.MarkForDeleteTimestamp}`);
}

