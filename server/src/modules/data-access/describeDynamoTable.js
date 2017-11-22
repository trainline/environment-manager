/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { createLowLevelDynamoClient: DynamoDB } = require('../amazon-client/masterAccountClient');
let memoize = require('../memoize');

function describeTableArn(TableName) {
  return DynamoDB()
  .then(dynamo => dynamo.describeTable({ TableName }).promise())
  .then(({ Table }) => ({ Table }));
}

/**
 * @description Return a memoized description of a DynamoDB table
 * @param {string} TableName - The name of the table
 * @returns {object} - The table description
 */
let describe = memoize(describeTableArn);

module.exports = describe;
