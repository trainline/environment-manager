/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let util = require('util');
let RequestBuilder = require('modules/awsDynamo/awsDynamoRequestBuilder');
let awsResourceNameProvider = require('modules/awsResourceNameProvider');
let AwsError = require('modules/errors/AwsError.class');
let DynamoRequestError = require('modules/errors/DynamoRequestError.class');
let DynamoConcurrencyError = require('modules/errors/DynamoConcurrencyError.class');
let DynamoItemNotFoundError = require('modules/errors/DynamoItemNotFoundError.class');
let DynamoTableNotFoundError = require('modules/errors/DynamoTableNotFoundError.class');
let DynamoConditionCheckError = require('modules/errors/DynamoConditionCheckError.class');
let DynamoItemAlreadyExistsError = require('modules/errors/DynamoItemAlreadyExistsError.class');
let logger = require('modules/logger');

function removeEmptyStrings(data) {
  for (let property in data) {
    let value = data[property];
    let type = typeof value;

    switch (type) {
      case 'string':
        if (value === '') delete data[property];
        break;
      case 'object':
        removeEmptyStrings(value);
        break;
    }
  }
}

class DynamoTableResource {

  constructor(config, client) {
    this.client = client;
    this._tableName = awsResourceNameProvider.getTableName(config.table);
    this._keyName = config.key;
    this._resourceName = config.resourceName;
    this._rangeName = config.range;
    this._auditingEnabled = config.auditingEnabled;
    this._builder = new RequestBuilder({
      table: this._tableName,
      key: this._keyName,
      range: this._rangeName,
      version: config.auditingEnabled ? 'Audit.Version' : null,
      dateField: config.dateField,
    });
  }

  getKeyName() {
    return this._keyName;
  }

  getRangeName() {
    return this._rangeName;
  }

  isAuditingEnabled() {
    return this._auditingEnabled;
  } 

  _buildPrimaryKey(key, range) {
    let primaryKey = {};

    if (this._keyName && key) primaryKey[this._keyName] = key;
    if (this._rangeName && range) primaryKey[this._rangeName] = range;

    return primaryKey;
  }

  get(params) {
    let self = this;
    let request = {
      TableName: this._tableName,
      Key: this._buildPrimaryKey(params.key, params.range),
    };

    return this.client.get(request).promise().then(data => {
      if (!data.Item) {
        let message = !params.range ?
          `No ${self._resourceName} found for ${self._keyName} ${params.key}.` :
          `No ${self._resourceName} found for ${self._keyName} ${params.key} and ${self._rangeName} "${params.range}".`;

        throw new DynamoItemNotFoundError(message);
      } else {
        let result = arrangeItem(data.Item, params.formatting);
        return result;
      }
    }).catch(error => {
      throw standardifyError(error, request, params.suppressError);
    });
  }

  query(params) {
    let self = this;
    let request = {
      TableName: this._tableName,
      KeyConditionExpression: `${this._keyName} = :key`,
      ExpressionAttributeValues: {
        ":key": params.key
      }
    };

    return this.client.query(request).promise().then(data => {
      if (!_.isArray(data.Items) || data.Items.length === 0) {
        let message = `No ${self._resourceName} items found for ${self._keyName} ${params.key}.`;
        throw new DynamoItemNotFoundError(message);
      } else {
        return data.Items;
      }
    }).catch(error => {
      throw standardifyError(error, request, params.suppressError);
    });
  }

  all(params) {
    let self = this;
    let request = this._builder.scan().filterBy(params.filter).limitTo(params.limit).buildRequest();
    let items = [];

    function scan() {
      return self.client.scan(request).promise().then(data => {
        items = items.concat(data.Items.map(item => arrangeItem(item, params.formatting)));
        if (request.Limit || !data.LastEvaluatedKey) return items;

        // Scan from next index
        request.ExclusiveStartKey = data.LastEvaluatedKey;
        return scan();
      }).catch(error => {
        throw standardifyError(error, request, params.suppressError);
      });
    }

    return scan();
  }

  put(params) {
    let self = this;
    let item = params.item;
    let key = (!!this._keyName) ? item[this._keyName] : null;
    let range = (!!this._rangeName) ? item[this._rangeName] : null;
    let expectedVersion = params.expectedVersion;

    removeEmptyStrings(item);

    function hasNotExpectedVersion(data) {
      if (!expectedVersion) return false;
      if (!data.Item.Audit) return false;

      return data.Item.Audit.Version !== expectedVersion;
    }

    function investigateOnErrorOccurred() {
      let request = {
        TableName: self._tableName,
        Key: self._buildPrimaryKey(key, range),
      };

      return self.client.get(request).promise().then(data => {
        if (!data.Item) {
          let message = !params.range ?
            `No ${self._resourceName} found for ${self._keyName} ${key}.` :
            `No ${self._resourceName} found for ${self._keyName} ${key} and ${self._rangeName} ${range}.`;

          // Expected item to update not found
          throw new DynamoItemNotFoundError(message);
        } else if (hasNotExpectedVersion(data)) {
          // ExpectedVersion different from the expected one
          let message = 'This record has been changed by another user or operation. Please reload the page to view the latest version.';
          throw new DynamoConcurrencyError(message);
        } else {
          // I really do not know what has happened
          let message = 'Item update has failed even if an item with the same key has been found.';
          throw new DynamoConditionCheckError(message);
        }
      }).catch(error => {
        // Something went wrong
        throw standardifyError(error, request);
      });
    }

    let request = !!this._auditingEnabled ?
      this._builder.update().item(item).atVersion(expectedVersion).buildRequest() :
      this._builder.update().item(item).buildRequest();

    return this.client.update(request).promise().then(function (data) {
      // Existing item succesfully updated
      return data.Attributes;
    }).catch(error => {
      // Something went wrong...
      let managedError = standardifyError(error, request);

      // I cannot furhter investigate on this error
      if (managedError.name !== 'DynamoConditionCheckError') {
        throw standardifyError(error, request);
      }

      // I can further investigate...
      return investigateOnErrorOccurred();
    });
  }

  post(params) {
    let self = this;
    let item = params.item;
    let key = (!!this._keyName) ? item[this._keyName] : null;
    let range = (!!this._rangeName) ? item[this._rangeName] : null;

    removeEmptyStrings(item);

    function investigateOnErrorOccurred() {
      let request = {
        TableName: self._tableName,
        Key: self._buildPrimaryKey(key, range),
      };

      return self.client.get(request).promise().then(data => {
        if (data.Item) { // Found an item with the same key
          let message = 'Item cannot be created as an item with the same key already exists.';
          throw new DynamoItemAlreadyExistsError(message);
        } else { // I really do not know what has happened
          let message = 'Item creation has failed but no item with the same key has been found.';
          throw new DynamoConditionCheckError(message);
        }
      }).catch(error => {
        throw standardifyError(error, request);
      });
    }

    let request = this._builder.insert().item(item).buildRequest();
    return this.client.put(request).promise().then(data => data.Attributes)
      .catch(error => {

        // Something went wrong...
        let managedError = standardifyError(error, request);

        // I cannot furhter investigate on this error
        if (managedError.name !== 'DynamoConditionCheckError') {
          throw standardifyError(error, request, true);
        }

        // I can furhter investigate...
        return investigateOnErrorOccurred();
      });
  }

  delete(params) {
    let request = {
      TableName: this._tableName,
      Key: this._buildPrimaryKey(params.key, params.range),
    };

    return this.client.delete(request).promise().then(data => {})
      .catch(error => {
        throw standardifyError(error, request);
      });
  }
}

function standardifyError(error, request, suppressError) {
  let awsError = new AwsError(error.message);
  if (suppressError !== true) {
    logger.error(awsError);
  }

  switch (error.code) {
    case 'ResourceNotFoundException':
      return new DynamoTableNotFoundError(`DynamoDB table "${this._tableName}" not found.`, awsError);

    case 'ConditionalCheckFailedException':
      return new DynamoConditionCheckError(
        `An error has occurred handling following request: ${parseRequest(request)}`,
        awsError
      );

    case 'ValidationException':
      return new DynamoRequestError(
        `An error has occurred handling following request: ${parseRequest(request)}`,
        awsError
      );

    default:
      return awsError;
  }
}

function parseRequest(request) {
  return util.inspect(request).replace('\n', '');
}

function arrangeItem(item, formatting) {
  if (!item) return item;
  switch (formatting.exposeAudit) {
    case 'full':
      break;
    case 'version-only':
      // "Audit" column has designed for internal purposes but its "Version"
      // property is useful for enabling concurrency check client-side.
      // For this reason "Version" property is moved at root item level and
      // "Audit" column is deleted.
      item.Version = (item.Audit ? (item.Audit.Version || 0) : 0);
      delete item.Audit;
      break;
    default:
      delete item.Audit;
      break;
  }

  return item;
}

module.exports = DynamoTableResource;
