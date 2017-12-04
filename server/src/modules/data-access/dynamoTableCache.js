/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let dynamoTable = require('./dynamoTable');
let cacheManager = require('../cacheManager');
let logger = require('../logger');

function logError(message, tableName) {
  return (error) => {
    logger.error(`${message}. table=${tableName}`);
    logger.error(error);
  };
}

function dynamoTableCache(logicalTableName, { ttl }) {
  let cache = cacheManager.create(logicalTableName, dynamoTable.scan, { stdTTL: ttl });

  function create(tableName, createSpec) {
    return dynamoTable.create(tableName, createSpec)
      .then(() => cache.del(tableName).catch(logError('Could not invalidate cache', tableName)));
  }

  function $delete(tableName, deleteSpec) {
    return dynamoTable.delete(tableName, deleteSpec)
      .then(() => cache.del(tableName).catch(logError('Could not invalidate cache', tableName)));
  }

  function get(tableName, key) {
    return dynamoTable.get(tableName, key);
  }

  function query(tableName, expressions) {
    return dynamoTable.query(tableName, expressions);
  }

  function replace(tableName, replaceSpec) {
    return dynamoTable.replace(tableName, replaceSpec)
      .then(() => cache.del(tableName).catch(logError('Could not invalidate cache', tableName)));
  }

  function scan(tableName, filter) {
    if (filter) {
      return dynamoTable.scan(tableName, filter);
    } else {
      return cache.get(tableName).catch((error) => {
        logError('Could not get from cache', tableName)(error);
        return dynamoTable.scan(tableName);
      });
    }
  }

  function update(tableName, updateSpec) {
    return dynamoTable.update(tableName, updateSpec)
      .then(() => cache.del(tableName).catch(logError('Could not invalidate cache', tableName)));
  }

  return {
    create,
    delete: $delete,
    get,
    query,
    replace,
    scan,
    update
  };
}

module.exports = dynamoTableCache;
