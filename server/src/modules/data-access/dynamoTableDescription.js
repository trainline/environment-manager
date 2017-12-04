/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let fp = require('lodash/fp');

let tableArn = fp.get(['Table', 'TableArn']);

let hashKeyAttributeName = fp.flow(
  fp.get(['Table', 'KeySchema']),
  fp.find({ KeyType: 'HASH' }),
  fp.get(['AttributeName']));

let keyAttributeNames = fp.flow(
  fp.get(['Table', 'KeySchema']),
  fp.map(fp.get(['AttributeName'])));

let tableName = fp.get(['Table', 'TableName']);

let extractKey = (tableDescription, item) => fp.pick(keyAttributeNames(tableDescription))(item);

/**
 * @description Construct a DynamoDB hash key
 * @param {object} tableDescription - The table description
 * @param {string} key - The value of the hash key
 * @returns {object} - The DynamoDB hash key
 * @example
 * For a table having a hash key attribute named 'ID'
 * hashkey(tableDescription, '1006') -> { ID: '1006' }
 */
let hashKey = (tableDescription, key) => fp.fromPairs([
  [hashKeyAttributeName(tableDescription), key]
]);

module.exports = {
  extractKey,
  hashKey,
  hashKeyAttributeName,
  keyAttributeNames,
  tableName,
  tableArn
};
