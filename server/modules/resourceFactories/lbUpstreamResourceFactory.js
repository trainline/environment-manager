/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const UPSTREAMS_TABLE = 'InfraConfigLBUpstream';

let Promise = require('bluebird');
let utils = require('modules/utilities');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let dynamoTable = require('modules/data-access/dynamoTable');
let { convertToNewModel } = require('modules/data-access/lbUpstreamAdapter');
let { mkArn } = require('modules/data-access/dynamoTableArn');
let { makeWritable } = require('modules/data-access/dynamoItemFilter');
let { getTableName: physicalTableName } = require('modules/awsResourceNameProvider');
let { softDelete } = require('modules/data-access/dynamoSoftDelete');
let dynamoVersion = require('modules/data-access/dynamoVersion');
let DynamoTableResource = require('./DynamoTableResource');
let _ = require('lodash');
let {
  assign,
  flow,
  mapKeys,
  omitBy,
  pickBy,
  replace
} = require('lodash/fp');


function fromNativeDynamoItem(item) {
  if (!item.value) return item;

  let itemClone = _.clone(item);

  itemClone.Value = utils.safeParseJSON(itemClone.value);
  delete itemClone.value;

  return itemClone;
}

function LBUpstreamTableResource(config, client) {
  this.client = client;

  let $base = new DynamoTableResource(config, client);

  this.getKeyName = $base.getKeyName.bind($base);
  this.getRangeName = $base.getRangeName.bind($base);
  this.isAuditingEnabled = $base.isAuditingEnabled.bind($base);
  this._buildPrimaryKey = $base._buildPrimaryKey.bind($base); // eslint-disable-line no-underscore-dangle

  this.get = function (params) {
    return $base.get(params).then(item => fromNativeDynamoItem(item));
  };

  this.all = function (params) {
    return $base.all(params).then(items => items.map(fromNativeDynamoItem));
  };

  this.put = function (params) {
    function convertAuditPathsToNestedProperties(record) {
      let isAuditProperty = (v, k) => k.startsWith('Audit.');
      let Audit = flow(
        pickBy(isAuditProperty),
        mapKeys(replace('Audit.', '')))(record);

      return flow(
        omitBy(isAuditProperty),
        assign({ Audit })
      )(record);
    }

    let { item, expectedVersion } = params;
    if (item.__Deleted) { // eslint-disable-line no-underscore-dangle
      return Promise.resolve();
    }
    let tableArnP = mkArn({ tableName: physicalTableName(UPSTREAMS_TABLE) });
    let recordP = convertToNewModel(convertAuditPathsToNestedProperties(item));
    let expectedVersionP = expectedVersion
      ? Promise.resolve(expectedVersion)
      : this.get({ key: item.key, formatting: { exposeAudit: 'version-only' } })
        .then(({ Version }) => Version);

    function show(x) { console.log(x); return x; }
    return Promise.join(tableArnP, recordP, expectedVersionP, (t, r, e) => flow(
      makeWritable,
      record => ({ record, expectedVersion: e }),
      show,
      dynamoVersion.compareAndSetVersionOnPut('Key'),
      dynamoTable.replace.bind(null, t)
    )(r));
  };

  this.post = function (params) {
    // convert to new schema before writing. must include account
    let { item } = params;
    let tableArnP = mkArn({ tableName: physicalTableName(UPSTREAMS_TABLE) });
    let recordP = convertToNewModel(item);
    return Promise.join(tableArnP, recordP, (t, r) => flow(
      makeWritable,
      record => ({ record }),
      dynamoVersion.compareAndSetVersionOnCreate('Key'),
      dynamoTable.create.bind(null, t)
    )(r));
  };

  this.delete = function (params) {
    let { expectedVersion, key: keyValue, metadata } = params;
    let key = { Key: keyValue };
    let tableArnP = mkArn({ tableName: physicalTableName(UPSTREAMS_TABLE) });
    return tableArnP.then((tableArn) => {
      return dynamoTable.update(tableArn, softDelete({ key, metadata, expectedVersion }))
        .then(() => dynamoTable.delete(tableArn, { key }));
    });
  };
}


module.exports = {
  canCreate: resourceDescriptor =>

    // NOTE: Find a better way to specialize factories
    resourceDescriptor.type.toLowerCase() === 'dynamodb/table' &&
    resourceDescriptor.name.toLowerCase() === 'config/lbupstream',

  create: (resourceDescriptor, parameters) =>
    amazonClientFactory.createDynamoClient(parameters.accountName).then((client) => {
      let config = {
        resourceName: resourceDescriptor.name,
        table: resourceDescriptor.tableName,
        key: resourceDescriptor.keyName,
        range: resourceDescriptor.rangeName,
        auditingEnabled: resourceDescriptor.enableAuditing,
        dateField: resourceDescriptor.dateField
      };

      return new LBUpstreamTableResource(config, client);
    })
};
