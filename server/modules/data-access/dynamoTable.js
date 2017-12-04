/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let extractKey = require('./dynamoTableDescription').extractKey;
let describeDynamoTable = require('./describeDynamoTable');
let pages = require('../amazon-client/pages');
let { createDynamoClient: DocumentClient } = require('../amazon-client/masterAccountClient');
let compile = require('../awsDynamo/dynamodbExpression').compile;

function compileIfSet(expressions) {
  if (expressions && typeof expressions === 'object') {
    return compile(expressions);
  } else {
    return {};
  }
}

let logError = params => (error) => {
  console.error(JSON.stringify(params, null, 2));
  return Promise.reject(error);
};

function get(TableName, key) {
  let params = {
    TableName,
    Key: key
  };
  return DocumentClient()
    .then(dynamo => dynamo.get(params).promise())
    .then(result => result.Item || null)
    .catch(logError(params));
}

function scan(TableName, expressions) {
  let params = Object.assign({ TableName }, compileIfSet(expressions));
  return DocumentClient()
    .then(dynamo => pages.flatten(rsp => rsp.Items, dynamo.scan(params)))
    .catch(logError(params));
}

function query(TableName, expressions) {
  let params = Object.assign({ TableName }, compileIfSet(expressions));
  return DocumentClient()
    .then(dynamo => pages.flatten(rsp => rsp.Items, dynamo.query(params)))
    .catch(logError(params));
}

function create(TableName, { record, expressions }) {
  return describeDynamoTable(TableName).then((tableDescription) => {
    let params = Object.assign({ TableName, Item: record }, compileIfSet(expressions));
    return DocumentClient()
      .then(dynamo => dynamo.put(params).promise())
      .catch((error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          let keyStr = JSON.stringify(extractKey(tableDescription, record));
          let message = `Could not create this item because an item with the same key already exists. table = ${TableName} key = ${keyStr}.`;
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      })
      .catch(logError(params));
  });
}

function replace(TableName, { record, expressions }) {
  return describeDynamoTable(TableName).then((tableDescription) => {
    let params = Object.assign({ TableName, Item: record }, compileIfSet(expressions));
    return DocumentClient()
      .then(dynamo => dynamo.put(params).promise())
      .catch((error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          let keyStr = JSON.stringify(extractKey(tableDescription, record));
          let message = `Could not update this item because it has been modified. table = ${TableName} key = ${keyStr}.`;
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      })
      .catch(logError(params));
  });
}

function update(TableName, { key, expressions }) {
  return Promise.resolve().then(() => {
    let params = Object.assign({ TableName, Key: key }, compileIfSet(expressions));
    return DocumentClient()
      .then(dynamo => dynamo.update(params).promise())
      .catch((error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          let keyStr = JSON.stringify(key);
          let message = `Could not update this item because it has been modified. table = ${TableName} key = ${keyStr}.`;
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      })
      .catch(logError(params));
  });
}

function $delete(TableName, { key, expressions }) {
  return Promise.resolve().then(() => {
    let params = Object.assign({ TableName, Key: key }, compileIfSet(expressions));
    return DocumentClient()
      .then(dynamo => dynamo.delete(params).promise())
      .catch((error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          let keyStr = JSON.stringify(key);
          let message = `Could not delete this item because it has been modified. table = ${TableName} key = ${keyStr}.`;
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      })
      .catch(logError(params));
  });
}

module.exports = {
  create,
  delete: $delete,
  get,
  query,
  replace,
  scan,
  update
};
