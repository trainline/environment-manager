/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { mkArn } = require('modules/data-access/dynamoTableArn');
let { attachAuditMetadata, updateAuditMetadata } = require('modules/data-access/dynamoAudit');
let describeDynamoTable = require('modules/data-access/describeDynamoTable');
let { hashKeyAttributeName } = require('modules/data-access/dynamoTableDescription');
let { tableArn } = require('modules/data-access/dynamoTableDescription');
let { makeWritable } = require('modules/data-access/dynamoItemFilter');
let dynamoVersion = require('modules/data-access/dynamoVersion');
let { softDelete } = require('modules/data-access/dynamoSoftDelete');
let fp = require('lodash/fp');

function factory(physicalTableName, dynamoTable) {
  let tableDescriptionPromise = () => mkArn({ tableName: physicalTableName }).then(describeDynamoTable);

  function create(item) {
    return tableDescriptionPromise().then(description =>
      fp.flow(
        makeWritable,
        attachAuditMetadata,
        record => ({ record }),
        dynamoVersion.compareAndSetVersionOnCreate(hashKeyAttributeName(description)),
        dynamoTable.create.bind(null, tableArn(description))
      )(item)
    );
  }

  function $delete(item, expectedVersion) {
    let { key, metadata } = item;
    return tableDescriptionPromise().then((description) => {
      let table = tableArn(description);
      return dynamoTable.update(table, softDelete({ key, metadata, expectedVersion }))
        .then(_ => dynamoTable.delete(table, { key }));
    });
  }

  function get(key) {
    return tableDescriptionPromise()
      .then(description => dynamoTable.get(tableArn(description), key));
  }

  function put(item, expectedVersion) {
    return tableDescriptionPromise().then(description =>
      fp.flow(
        makeWritable,
        attachAuditMetadata,
        record => ({ record, expectedVersion }),
        dynamoVersion.compareAndSetVersionOnPut(hashKeyAttributeName(description)),
        dynamoTable.replace.bind(null, tableArn(description))
      )(item)
    );
  }

  function query(expression) {
    return tableDescriptionPromise()
      .then(description => dynamoTable.query(tableArn(description), expression));
  }

  function replace(item, expectedVersion) {
    return tableDescriptionPromise().then(description =>
      fp.flow(
        makeWritable,
        attachAuditMetadata,
        record => ({ record, expectedVersion }),
        dynamoVersion.compareAndSetVersionOnReplace,
        dynamoTable.replace.bind(null, tableArn(description))
      )(item)
    );
  }

  function scan(expression) {
    return tableDescriptionPromise()
      .then(description => dynamoTable.scan(tableArn(description), expression));
  }

  function update(expression, expectedVersion) {
    return tableDescriptionPromise().then(description =>
      fp.flow(
        updateAuditMetadata,
        updateExpression => ({
          key: expression.key,
          expressions: { UpdateExpression: updateExpression },
          expectedVersion
        }),
        dynamoVersion.compareAndSetVersionOnUpdate,
        dynamoTable.update.bind(null, tableArn(description))
      )(expression)
    );
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
