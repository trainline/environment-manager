/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
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

function DynamoTableResource(config, client) {
  let _client = client;
  let _tableName = awsResourceNameProvider.getTableName(config.table);
  let _keyName = config.key;
  let _resourceName = config.resourceName;
  let _rangeName = config.range;
  let _auditingEnabled = config.auditingEnabled;
  let _builder = new RequestBuilder({
    table: _tableName,
    key: _keyName,
    range: _rangeName,
    version: config.auditingEnabled ? 'Audit.Version' : null,
    dateField: config.dateField,
  });

  this.getKeyName = () => _keyName;

  this.getRangeName = () => _rangeName;

  this.isAuditingEnabled = () => _auditingEnabled;

  function buildPrimaryKey(key, range) {
    let primaryKey = {};

    if (_keyName && key) primaryKey[_keyName] = key;
    if (_rangeName && range) primaryKey[_rangeName] = range;

    return primaryKey;
  }


  function standardifyError(error, request) {
    let awsError = new AwsError(error.message);
    logger.error(awsError);

    switch (error.code) {
      case 'ResourceNotFoundException':
        return new DynamoTableNotFoundError(`DynamoDB table "${_tableName}" not found.`, awsError);

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

  this.get = function (params) {
    /* params = {
        key: 'key-value',    // mandatory
        range: 'range-value' // optional
    }*/

    let request = {
      TableName: _tableName,
      Key: buildPrimaryKey(params.key, params.range),
    };

    function tryGet(client) {
      return client.get(request).promise().then(data => {
        if (!data.Item) {
          let message = !params.range ?
            `No ${_resourceName} found for ${_keyName} ${params.key}.` :
            `No ${_resourceName} found for ${_keyName} ${params.key} and ${_rangeName} "${params.range}".`;

          throw new DynamoItemNotFoundError(message);
        } else {
          let result = arrangeItem(data.Item, params.formatting);
          return result;
        }
      }).catch(error => {
        throw standardifyError(error, request);
      });
    }

    return tryGet(_client);
  };

  this.all = function (params) {
    let request = _builder.scan().filterBy(params.filter).limitTo(params.limit).buildRequest();
    let items = [];

    function scan(client) {
      return client.scan(request).promise().then(data => {
        items = items.concat(data.Items.map(item => arrangeItem(item, params.formatting)));
        if (request.Limit || !data.LastEvaluatedKey) return items;

        // Scan from next index
        request.ExclusiveStartKey = data.LastEvaluatedKey;
        return scan(client);
      }).catch(error => {
        throw standardifyError(error, request);
      });
    }

    return scan(_client);
  };

  this.put = function (params) {
    let item = params.item;
    let key = (!!_keyName) ? item[_keyName] : null;
    let range = (!!_rangeName) ? item[_rangeName] : null;
    let expectedVersion = params.expectedVersion;

    function hasNotExpectedVersion(data) {
      if (!expectedVersion) return false;
      if (!data.Item.Audit) return false;

      return data.Item.Audit.Version !== expectedVersion;
    }

    function investigateOnErrorOccurred(client) {
      let request = {
        TableName: _tableName,
        Key: buildPrimaryKey(key, range),
      };

      return client.get(request).promise().then(data => {
        if (!data.Item) {
          let message = !params.range ?
            `No ${_resourceName} found for ${_keyName} ${key}.` :
            `No ${_resourceName} found for ${_keyName} ${key} and ${_rangeName} ${range}.`;

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

    function tryUpdate(client) {
      let request = !!_auditingEnabled ?
        _builder.update().item(item).atVersion(expectedVersion).buildRequest() :
        _builder.update().item(item).buildRequest();

      return client.update(request).promise().then(function (data) {
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
        return investigateOnErrorOccurred(client);
      });
    }

    return tryUpdate(_client);
  };

  this.post = function (params) {
    let item = params.item;
    let key = (!!_keyName) ? item[_keyName] : null;
    let range = (!!_rangeName) ? item[_rangeName] : null;

    function investigateOnErrorOccurred(client) {
      let request = {
        TableName: _tableName,
        Key: buildPrimaryKey(key, range),
      };

      return client.get(request).promise().then(data => {
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

    let request = _builder.insert().item(item).buildRequest();
    return client.put(request).promise().then(data => data.Attributes)
      .catch(error => {

        // Something went wrong...
        let managedError = standardifyError(error, request);

        // I cannot furhter investigate on this error
        if (managedError.name !== 'DynamoConditionCheckError') {
          throw standardifyError(error, request);
        }

        // I can furhter investigate...
        return investigateOnErrorOccurred(client);
      });
  };

  this.delete = function (params) {
    /* params = {
        key: 'key-value',    // mandatory
        range: 'range-value' // optional
    }*/

    let request = {
      TableName: _tableName,
      Key: buildPrimaryKey(params.key, params.range),
    };

    return client.delete(request).promise().then(data => {})
      .catch(error => {
        throw standardifyError(error, request);
      });
  };
}

module.exports = DynamoTableResource;
