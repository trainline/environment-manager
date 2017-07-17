/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { attachAuditMetadata, updateAuditMetadata } = require('modules/data-access/dynamoAudit');
let describeDynamoTable = require('modules/data-access/describeDynamoTable');
let { hashKeyAttributeName } = require('modules/data-access/dynamoTableDescription');
let { makeWritable } = require('modules/data-access/dynamoItemFilter');
let dynamoVersion = require('modules/data-access/dynamoVersion');
let { softDelete } = require('modules/data-access/dynamoSoftDelete');
let fp = require('lodash/fp');

function factory(physicalTableName, dynamoTable) {
  let tableDescriptionPromise = () => describeDynamoTable(physicalTableName);

  function create(item) {
    return tableDescriptionPromise().then(description =>
      fp.flow(
        makeWritable,
        attachAuditMetadata,
        record => ({ record }),
        dynamoVersion.compareAndSetVersionOnCreate(hashKeyAttributeName(description)),
        dynamoTable.create.bind(null, physicalTableName)
      )(item)
    );
  }

  function $delete(item, expectedVersion) {
    let { key, metadata } = item;
    return dynamoTable.update(physicalTableName, softDelete({ key, metadata, expectedVersion }))
      .then(_ => dynamoTable.delete(physicalTableName, { key }));
  }

  function get(key) {
    return dynamoTable.get(physicalTableName, key);
  }

  function put(item, expectedVersion) {
    return tableDescriptionPromise().then(description =>
      fp.flow(
        makeWritable,
        attachAuditMetadata,
        record => ({ record, expectedVersion }),
        dynamoVersion.compareAndSetVersionOnPut(hashKeyAttributeName(description)),
        dynamoTable.replace.bind(null, physicalTableName)
      )(item)
    );
  }

  function query(expression) {
    return dynamoTable.query(physicalTableName, expression);
  }

  function replace(item, expectedVersion) {
    return fp.flow(
      makeWritable,
      attachAuditMetadata,
      record => ({ record, expectedVersion }),
      dynamoVersion.compareAndSetVersionOnReplace,
      dynamoTable.replace.bind(null, physicalTableName)
    )(item);
  }

  function scan(expression) {
    return dynamoTable.scan(physicalTableName, expression);
  }

  function update(expression, expectedVersion) {
    return fp.flow(
        updateAuditMetadata,
        updateExpression => ({
          key: expression.key,
          expressions: { UpdateExpression: updateExpression },
          expectedVersion
        }),
        dynamoVersion.compareAndSetVersionOnUpdate,
        dynamoTable.update.bind(null, physicalTableName)
      )(expression);
  }

  return {
    create,
    delete: $delete,
    get,
    put,
    query,
    replace,
    scan,
    update
  };
}

module.exports = factory;
