/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let utils = require('modules/utilities');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let DynamoTableResource = require('./DynamoTableResource');
let _ = require('lodash');


function fromNativeDynamoItem(item) {
  if (!item.value) return item;

  let itemClone = _.clone(item);

  itemClone.Value = utils.safeParseJSON(itemClone.value);
  delete itemClone.value;

  return itemClone;
}

function toNativeDynamoItem(item) {
  if (!item.Value) return item;

  let itemClone = _.clone(item);

  itemClone.value = JSON.stringify(itemClone.Value);
  delete itemClone.Value;

  return itemClone;
}

function LBUpstreamTableResource(config, client) {
  this.client = client;

  let $base = new DynamoTableResource(config, client);

  this.getKeyName = $base.getKeyName.bind($base);
  this.getRangeName = $base.getRangeName.bind($base);
  this.isAuditingEnabled = $base.isAuditingEnabled.bind($base);
  this._buildPrimaryKey = $base._buildPrimaryKey.bind($base);

  this.get = function (params) {
    return $base.get(params).then(item => fromNativeDynamoItem(item));
  };

  this.all = function (params) {
    return $base.all(params).then(items => items.map(fromNativeDynamoItem));
  };

  this.put = function (params) {
    params.item = toNativeDynamoItem(params.item);
    return $base.put(params);
  };

  this.post = function (params) {
    params.item = toNativeDynamoItem(params.item);
    return $base.post(params);
  };

  this.delete = $base.delete.bind($base);
}


module.exports = {
  canCreate: (resourceDescriptor) =>

    // NOTE: Find a better way to specialize factories
    resourceDescriptor.type.toLowerCase() === 'dynamodb/table' &&
    resourceDescriptor.name.toLowerCase() === 'config/lbupstream',

  create: (resourceDescriptor, parameters) =>
  amazonClientFactory.createDynamoClient(parameters.accountName).then((client) => {

    let config = {
      resourceName:    resourceDescriptor.name,
      table:           resourceDescriptor.tableName,
      key:             resourceDescriptor.keyName,
      range:           resourceDescriptor.rangeName,
      auditingEnabled: resourceDescriptor.enableAuditing,
      dateField:       resourceDescriptor.dateField,
    };

    return new LBUpstreamTableResource(config, client);
  }),
};
