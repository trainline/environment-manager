/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const UPSTREAMS_TABLE = 'InfraConfigLBUpstream';

let Promise = require('bluebird');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let dynamoTable = require('modules/data-access/dynamoTable');
let { convertToNewModel, convertToOldModel } = require('modules/data-access/lbUpstreamAdapter');
let { mkArn } = require('modules/data-access/dynamoTableArn');
let { makeWritable } = require('modules/data-access/dynamoItemFilter');
let { getTableName: physicalTableName } = require('modules/awsResourceNameProvider');
let { softDelete } = require('modules/data-access/dynamoSoftDelete');
let dynamoVersion = require('modules/data-access/dynamoVersion');
let DynamoTableResource = require('./DynamoTableResource');
let { versionOf } = require('modules/data-access/dynamoVersion');
let { removeAuditMetadata } = require('modules/data-access/dynamoAudit');
let _ = require('lodash');
let {
  assign,
  flow,
  map,
  mapKeys,
  omitBy,
  pickBy,
  replace
} = require('lodash/fp');
let { getByName: getAccountByName } = require('modules/awsAccounts');

function convertToApiModel(persistedModel) {
  let apiModel = removeAuditMetadata(persistedModel);
  let Version = versionOf(persistedModel);
  return Object.assign(apiModel, { Version });
}

function LBUpstreamTableResource(config, client) {
  this.client = client;
  this.accountId = config.accountId;

  let $base = new DynamoTableResource(config, client);

  this.getKeyName = $base.getKeyName.bind($base);
  this.getRangeName = $base.getRangeName.bind($base);
  this.isAuditingEnabled = $base.isAuditingEnabled.bind($base);
  this._buildPrimaryKey = $base._buildPrimaryKey.bind($base); // eslint-disable-line no-underscore-dangle

  this.get = function (params) {
    return mkArn({ tableName: physicalTableName(UPSTREAMS_TABLE) })
      .then(tableArn => dynamoTable.get(tableArn, { Key: params.key }))
      .then(convertToOldModel)
      .then(convertToApiModel);
  };

  this.all = function (params) {
    let queryParams = {
      IndexName: 'AccountId-index',
      KeyConditionExpression: ['=', ['at', 'AccountId'], ['val', this.accountId]],
      Limit: 20
    };
    return mkArn({ tableName: physicalTableName(UPSTREAMS_TABLE) })
      .then(tableArn => dynamoTable.query(tableArn, queryParams))
      .then(map(convertToOldModel))
      .then(map(convertToApiModel));
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

    return Promise.join(tableArnP, recordP, expectedVersionP, (t, r, e) => flow(
      makeWritable,
      record => ({ record, expectedVersion: e }),
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

  create(resourceDescriptor, parameters) {
    let accountIdP = getAccountByName(parameters.accountName)
      .then(({ AccountNumber }) => String(AccountNumber));
    let clientP = accountIdP.then(amazonClientFactory.createDynamoClient);
    let configP = accountIdP.then(accountId => ({
      accountId,
      resourceName: resourceDescriptor.name,
      table: resourceDescriptor.tableName,
      key: resourceDescriptor.keyName,
      range: resourceDescriptor.rangeName,
      auditingEnabled: resourceDescriptor.enableAuditing,
      dateField: resourceDescriptor.dateField
    }));
    return Promise.join(configP, clientP, (config, client) => new LBUpstreamTableResource(config, client));
  }
};
