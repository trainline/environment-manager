/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { attachAuditMetadata, updateAuditMetadata } = require('./dynamoAudit');
let describeDynamoTable = require('./describeDynamoTable');
let { hashKeyAttributeName } = require('./dynamoTableDescription');
let { makeWritable } = require('./dynamoItemFilter');
let dynamoVersion = require('./dynamoVersion');
let { softDelete } = require('./dynamoSoftDelete');
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

  function $delete(item, expectedVersion, { ConditionExpression } = {}) {
    let { key, metadata } = item;
    let keyExpresionPair = softDelete({ key, metadata, expectedVersion });
    if (ConditionExpression) {
      let { expressions } = keyExpresionPair;
      expressions.ConditionExpression = ['and', ConditionExpression, expressions.ConditionExpression];
    }
    return dynamoTable.update(physicalTableName, keyExpresionPair)
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
