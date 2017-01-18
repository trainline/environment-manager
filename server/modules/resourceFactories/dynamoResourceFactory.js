/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let DynamoTableResource = require('./DynamoTableResource');
let masterAccountClientFactory = require('modules/amazon-client/masterAccountClient');
let childAccountClientFactory = require('modules/amazon-client/childAccountClient');

function canCreate(resourceDescriptor) {
  // NOTE: Find a better way to specialize factories
  return resourceDescriptor.type.toLowerCase() === 'dynamodb/table' &&
    resourceDescriptor.name.toLowerCase() !== 'config/lbupstream' &&
    resourceDescriptor.name.toLowerCase() !== 'audit';
}

function create(resourceDescriptor, parameters, callback) {
  let isMasterResource = {}.hasOwnProperty.call(resourceDescriptor, 'perAccount') && resourceDescriptor.perAccount === false;
  let amazonClientFactory = isMasterResource ? masterAccountClientFactory : childAccountClientFactory;

  return amazonClientFactory.createDynamoClient(parameters.accountName).then(
    (client) => {
      let config = {
        resourceName: resourceDescriptor.name,
        table: resourceDescriptor.tableName,
        key: resourceDescriptor.keyName,
        range: resourceDescriptor.rangeName,
        auditingEnabled: resourceDescriptor.enableAuditing,
        dateField: resourceDescriptor.dateField
      };
      return new DynamoTableResource(config, client);
    }
  );
}


module.exports = {
  canCreate,
  create
};
