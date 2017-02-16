/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let extractKey = require('modules/data-access/dynamoTableDescription').extractKey;
let account = require('modules/data-access/dynamoTableArn').account;
let tableName = require('modules/data-access/dynamoTableArn').tableName;
let describeDynamoTable = require('modules/data-access/describeDynamoTable');
let pages = require('modules/amazon-client/pages');
let documentClient = require('modules/data-access/dynamoClientFactory').DocumentClient;
let compile = require('modules/awsDynamo/dynamodbExpression').compile;

function dynamoClient(tableArn) {
  let accountId = account(tableArn);
  return documentClient(accountId);
}

function compileIfSet(expressions) {
  if (expressions && typeof expressions === 'object') {
    return compile(expressions);
  } else {
    return {};
  }
}

function get(tableArn, key) {
  let params = {
    TableName: tableName(tableArn),
    Key: key
  };
  return dynamoClient(tableArn)
    .then(dynamo => dynamo.get(params).promise())
    .then(result => result.Item || null);
}

function scan(tableArn, expressions) {
  let TableName = tableName(tableArn);
  let params = Object.assign({ TableName }, compileIfSet(expressions));
  return dynamoClient(tableArn)
    .then(dynamo => pages.flatten(rsp => rsp.Items, dynamo.scan(params)));
}

function create(tableArn, { record, expressions }) {
  return describeDynamoTable(tableArn).then((tableDescription) => {
    let TableName = tableName(tableArn);
    let params = Object.assign({ TableName, Item: record }, compileIfSet(expressions));
    return dynamoClient(tableArn)
      .then(dynamo => dynamo.put(params).promise())
      .catch((error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          let keyStr = JSON.stringify(extractKey(tableDescription, record));
          let message = `Could not create this item because an item with the same key already exists. table = ${TableName} key = ${keyStr}.`;
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      });
  });
}

function replace(tableArn, { record, expressions }) {
  return describeDynamoTable(tableArn).then((tableDescription) => {
    let TableName = tableName(tableArn);
    let params = Object.assign({ TableName, Item: record }, compileIfSet(expressions));
    return dynamoClient(tableArn)
      .then(dynamo => dynamo.put(params).promise())
      .catch((error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          let keyStr = JSON.stringify(extractKey(tableDescription, record));
          let message = `Could not update this item because it has been modified. table = ${TableName} key = ${keyStr}.`;
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      });
  });
}

function $delete(tableArn, { key, expressions }) {
  return describeDynamoTable(tableArn).then((tableDescription) => {
    let TableName = tableName(tableArn);
    let params = Object.assign({ TableName, Key: key }, compileIfSet(expressions));
    return dynamoClient(tableArn)
      .then(dynamo => dynamo.delete(params).promise())
      .catch((error) => {
        if (error.code === 'ConditionalCheckFailedException') {
          let keyStr = JSON.stringify(key);
          let message = `Could not delete this item because it has been modified. table = ${TableName} key = ${keyStr}.`;
          return Promise.reject(new Error(message));
        }
        return Promise.reject(error);
      });
  });
}

module.exports = {
  create,
  delete: $delete,
  get,
  replace,
  scan
};
