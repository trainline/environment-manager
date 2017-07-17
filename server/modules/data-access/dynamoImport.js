/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let fp = require('lodash/fp');
let Promise = require('bluebird');
let pages = require('modules/amazon-client/pages');
let { createDynamoClient: DocumentClient, createLowLevelDynamoClient: DynamoDB } = require('modules/amazon-client/masterAccountClient');
let { extractKey, keyAttributeNames } = require('modules/data-access/dynamoTableDescription');

function byKeyEqualityComparer(tableDescription) {
  let attrs = keyAttributeNames(tableDescription);
  return (x, y) => attrs.every(a => x[a] === y[a]);
}

function setDifference(equalsFn, xs, ys) {
  return xs.filter(x => !ys.some(y => equalsFn(x, y)));
}

function importItems({ items: importedItems, table: TableName, remove = false }) {
  return Promise.join(
    DocumentClient(),
    DynamoDB().then(dynamo => dynamo.describeTable({ TableName }).promise()),
    (table, description) => {
      function put(item) {
        let key = extractKey(description, item);
        return table.put({ TableName, Item: item }).promise()
          .then(() => ({ operation: 'put', key, status: 'success' }))
          .catch(() => ({ operation: 'put', key, status: 'failure' }));
      }

      function $delete(item) {
        let key = extractKey(description, item);
        return table.delete({ TableName, Key: key }).promise()
          .then(() => ({ operation: 'delete', key, status: 'success' }))
          .catch(() => ({ operation: 'delete', key, status: 'failure' }));
      }

      function getExistingItemsNotImported() {
        let keyAttrs = keyAttributeNames(description);
        return pages.flatten(rsp => rsp.Items, table.scan({
          TableName,
          ProjectionExpression: keyAttrs.map(a => `#${a}`).join(', '),
          ExpressionAttributeNames: fp.fromPairs(keyAttrs.map(a => [`#${a}`, a]))
        }))
          .then(existingItems => setDifference(byKeyEqualityComparer(description), existingItems, importedItems));
      }

      let operations = [
        Promise.map(importedItems, put, { concurrency: 10 }),
        (remove ? Promise.map(getExistingItemsNotImported(), $delete, { concurrency: 10 }) : Promise.resolve([]))
      ];

      return Promise.all(operations).then(fp.flatten);
    });
}


module.exports = importItems;
