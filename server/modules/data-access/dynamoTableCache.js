/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let dynamoTable = require('modules/data-access/dynamoTable');
let cacheManager = require('modules/cacheManager');
let logger = require('modules/logger');

function logError(message, tableArn) {
  return (error) => {
    logger.error(`${message}. table=${tableArn}`);
    logger.error(error);
  };
}

function dynamoTableCache(logicalTableName, { ttl }) {
  let cache = cacheManager.create(logicalTableName, dynamoTable.scan, { stdTTL: ttl });

  function create(tableArn, createSpec) {
    return dynamoTable.create(tableArn, createSpec)
      .then(_ => cache.del(tableArn).catch(logError('Could not invalidate cache', tableArn)));
  }

  function $delete(tableArn, deleteSpec) {
    return dynamoTable.delete(tableArn, deleteSpec)
      .then(_ => cache.del(tableArn).catch(logError('Could not invalidate cache', tableArn)));
  }

  function get(tableArn, key) {
    return dynamoTable.get(tableArn, key);
  }

  function replace(tableArn, replaceSpec) {
    return dynamoTable.replace(tableArn, replaceSpec)
      .then(_ => cache.del(tableArn).catch(logError('Could not invalidate cache', tableArn)));
  }

  function scan(tableArn, filter) {
    if (filter) {
      return dynamoTable.scan(tableArn, filter);
    } else {
      return cache.get(tableArn).catch((error) => {
        logError('Could not get from cache', tableArn);
        return dynamoTable.scan(tableArn);
      });
    }
  }

  function update(tableArn, updateSpec) {
    return dynamoTable.update(tableArn, updateSpec)
      .then(_ => cache.del(tableArn).catch(logError('Could not invalidate cache', tableArn)));
  }

  return {
    create,
    delete: $delete,
    get,
    replace,
    scan,
    update
  };
}

module.exports = dynamoTableCache;
