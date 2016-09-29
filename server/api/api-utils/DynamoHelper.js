/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
const accountName = require('config').getUserValue('masterAccountName');
const exposeAudit = 'version-only';

let getAllValues = require('queryHandlers/ScanDynamoResources');
let getValue = require('queryHandlers/GetDynamoResource');
let updateValue = require('commands/resources/UpdateDynamoResource');
let createValue = require('commands/resources/CreateDynamoResource');
let deleteValue = require('commands/resources/DeleteDynamoResource');
let metadata = require('commands/utils/metadata');


class DynamoHelper {

  constructor(resource) {
    this.resource = resource;
  }

  /**
   * Get all resources in a Dynamo table
   */
  getAll(filter) {
    return getAllValues({ resource: this.resource, exposeAudit, accountName, filter });
  }

  /**
   * Get a specific resource from a Dynamo table
   */
  getByKey(key) {
    return getValue({ resource: this.resource, key, exposeAudit, accountName });
  }

  /**
   * Get a specific resource from a Dynamo table that has includes sort key
   */
  getBySortKey(partitionKey, sortKey) {
    return getValue({ key: partitionKey, range: sortKey, resource: this.resource, exposeAudit, accountName });
  }

  /**
   * Create a resource in a Dynamo table
   */
  create(value, keyName, user) {
    const key = value[keyName];
    const Value = _.omit(value, keyName);
    const item = { Value };
    const newItem = metadata.addMetadata({ resource: this.resource, key, item, accountName, user });
    return createValue(newItem);
  }

  /**
   * Create a resource in a Dynamo table that includes a sort key
   */
  createWithSortKey(value, partitionKey, sortKey, user) {
    const item = { Value: value };
    const newItem = metadata.addMetadata({ key: partitionKey, range: sortKey, resource: this.resource, item, accountName, user });
    return createValue(newItem);
  }

  /**
   * Update (replace) a single Dynamo resource
   */
  update(key, keyName, value, expectedVersion, user) {
    const item = { Value: _.omit(value, keyName) };
    const updatedItem = metadata.addMetadata({ resource: this.resource, key, item, expectedVersion, accountName, user });
    return updateValue(updatedItem);
  }

  /**
   * Update (replace) a single Dynamo resource in a table that incldudes a sort key
   */
  updateWithSortKey(value, partitionKey, sortKey, expectedVersion, user) {
    const item = { Value: value };
    const updatedItem = metadata.addMetadata({ key: partitionKey, range: sortKey, resource: this.resource, item, expectedVersion, accountName, user });
    return updateValue(updatedItem);
  }

  /**
   * Delete a single item from a Dynamo table
   */
  deleteItem(key, user) {
    const deletedItem = metadata.addMetadata({ resource: this.resource, key, accountName, user });
    return deleteValue(deletedItem);
  }

  /**
   * Delete a single item from a Dynamo table that includes a sort key
   */
  deleteItemWithSortKey(partitionKey, sortKey, user) {
    const deletedItem = metadata.addMetadata({ resource: this.resource, key: partitionKey, range: sortKey, accountName, user });
    return deleteValue(deletedItem);
  }

}

module.exports = DynamoHelper;

