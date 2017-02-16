/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let account = require('modules/data-access/dynamoTableArn').account;
let dynamoClient = require('modules/data-access/dynamoClientFactory').DynamoDB;
let tableName = require('modules/data-access/dynamoTableArn').tableName;
let memoize = require('modules/memoize');

function describeTableArn(tableArn) {
  return dynamoClient(account(tableArn))
    .then(dynamo => dynamo.describeTable({ TableName: tableName(tableArn) }).promise());
}

/**
 * @description Return a memoized description of a DynamoDB table
 * @param {string} TableName - The name of the table
 * @returns {object} - The table description
 */
let describe = memoize(describeTableArn);

module.exports = describe;
