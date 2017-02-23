/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const exposeAudit = 'version-only';

let getAllValues = require('queryHandlers/ScanDynamoResources');
let scanCrossAccount = require('queryHandlers/ScanCrossAccountDynamoResources');
let getValue = require('queryHandlers/GetDynamoResource');
let queryRange = require('queryHandlers/QueryDynamoResource');
let updateValue = require('commands/resources/UpdateDynamoResource');
let createValue = require('commands/resources/CreateDynamoResource');
let deleteValue = require('commands/resources/DeleteDynamoResource');
let metadata = require('commands/utils/metadata');
let awsAccounts = require('modules/awsAccounts');

// TODO(Filip): once we move all tables to one master account, we can remove all options.accountName
// and do all operations on masterAccount
class DynamoHelper {

  constructor(resource) {
    this.resource = resource;
  }

  getAllCrossAccount(filter) {
    return scanCrossAccount({ resource: this.resource, exposeAudit, filter });
  }

  /**
   * Get all resources in a Dynamo table
   */
  getAll(filter, options = {}) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let accountName = options.accountName || masterAccountName;
        return getAllValues({ resource: this.resource, exposeAudit, accountName, filter });
      });
  }

  /**
   * Get a specific resource from a Dynamo table
   */
  getByKey(key, options = {}) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let accountName = options.accountName || masterAccountName;
        return getValue({ resource: this.resource, key, exposeAudit, accountName });
      });
  }

  /**
   * Get a specific resource from a Dynamo table that has includes sort key
   */
  getBySortKey(partitionKey, sortKey, options = {}) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let accountName = options.accountName || masterAccountName;
        return getValue({ key: partitionKey, range: sortKey, resource: this.resource, exposeAudit, accountName });
      });
  }

  /**
   * Query resources from a Dynamo table with partition key
   */
  queryRangeByKey(partitionKey, options = {}) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let accountName = options.accountName || masterAccountName;
        return queryRange({ key: partitionKey, resource: this.resource, exposeAudit, accountName });
      });
  }

  /**
   * Create a resource in a Dynamo table
   */
  create(key, item, user, options = {}) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let accountName = options.accountName || masterAccountName;
        const newItem = metadata.addMetadata({ resource: this.resource, key, item, accountName, user });
        return createValue(newItem);
      });
  }

  /**
   * Create a resource in a Dynamo table that includes a sort key
   */
  createWithSortKey(partitionKey, sortKey, item, user, options = {}) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let accountName = options.accountName || masterAccountName;
        const newItem = metadata.addMetadata({ key: partitionKey, range: sortKey, resource: this.resource, item, accountName, user });
        return createValue(newItem);
      });
  }

  /**
   * Update (replace) a single Dynamo resource
   */
  update(key, item, expectedVersion, user, options = {}) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let accountName = options.accountName || masterAccountName;
        const updatedItem = metadata.addMetadata({ resource: this.resource, key, item, expectedVersion, accountName, user });
        return updateValue(updatedItem);
      });
  }

  /**
   * Update (replace) a single Dynamo resource in a table that incldudes a sort key
   */
  updateWithSortKey(partitionKey, sortKey, item, expectedVersion, user, options = {}) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let accountName = options.accountName || masterAccountName;
        const updatedItem = metadata.addMetadata({ key: partitionKey, range: sortKey, resource: this.resource, item, expectedVersion, accountName, user });
        return updateValue(updatedItem);
      });
  }

  /**
   * Delete a single item from a Dynamo table
   */
  delete(key, user, options = {}) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let accountName = options.accountName || masterAccountName;
        const deletedItem = metadata.addMetadata({ resource: this.resource, key, accountName, user });
        return deleteValue(deletedItem);
      });
  }

  /**
   * Delete a single item from a Dynamo table that includes a sort key
   */
  deleteWithSortKey(partitionKey, sortKey, user, options = {}) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let accountName = options.accountName || masterAccountName;
        const deletedItem = metadata.addMetadata({ resource: this.resource, key: partitionKey, range: sortKey, accountName, user });
        return deleteValue(deletedItem);
      });
  }
}

module.exports = DynamoHelper;

