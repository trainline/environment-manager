/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let AWS = require('aws-sdk');
let async = require('async');
let guid = require('uuid/v1');
let path = require('path');
let user = require('../../../modules/user');
let server = require('../../../index');


const RESOURCE_PREFIX = 'EnvironmentManagerTests-';

function createDynamoClient() {
  return new AWS.DynamoDB.DocumentClient({region: 'eu-west-1'});
}

function getTableName(tableName) {
  return RESOURCE_PREFIX + tableName;
}

function arrangeAudit(item) {

  item.Audit = item.Audit || {};

  item.Audit.TransactionID = item.Audit.TransactionID || guid();
  item.Audit.User          = item.Audit.User          || 'test';
  item.Audit.LastChanged   = item.Audit.LastChanged   || new Date().toISOString();
  item.Audit.Version       = item.Audit.Version       || 0;

}
function getAll(tableName, callback) {
  var client = createDynamoClient();
  var tableName = getTableName(tableName);
  var items = [];
  var request = { TableName: tableName };

  function scan() {
    client.scan(request, function(error, data) {
      if (error) throw new Error(error.message);

      items = items.concat(data.Items);
      if(!data.LastEvaluatedKey) {
        callback(null, items);
        return;
      }
      // Scan from next index
      request.ExclusiveStartKey = data.LastEvaluatedKey
      scan();
    });
  };
  scan();
}
function resetTable(parameters, mainCallback) {
  var client = createDynamoClient();
  var tableName = getTableName(parameters.table);

  async.waterfall([
    function(callback) {
      getAll(parameters.table, callback);
    },
    function(items, callback) {
      function iterator(item, iteratorCallback) {
        var request = {TableName: tableName, Key: {} };
        if (parameters.key)   request.Key[parameters.key]   = item[parameters.key];
        if (parameters.range) request.Key[parameters.range] = item[parameters.range];
        client.delete(request, iteratorCallback);
      }
      async.forEach(items, iterator, callback);
    },
    function(callback) {
      function iterator(item, iteratorCallback) {
        if (parameters.auditing) arrangeAudit(item);
        var request = { TableName: tableName, Item: item };
        client.put(request, iteratorCallback);
      }
      async.forEach(parameters.items, iterator, callback);
    }
  ], mainCallback);
};

module.exports = {
  dynamo: {
    createClient: createDynamoClient,
    getTableName: getTableName,
    resetTable: resetTable,
    getAll: getAll
  },
  bearerToken: 'Bearer eyJuYW1lIjoidGVzdCIsInJvbGVzIjpbInZpZXciLCJ0b2dnbGUiLCJlZGl0Il0sImV4cGlyYXRpb24iOjE0NjMxOTgwMzcxMDYsImdyb3VwcyI6W10sInBlcm1pc3Npb25zIjpbeyJBY2Nlc3MiOiJBRE1JTiIsIlJlc291cmNlIjoiKioifV19',
  cookie: {
    create: function() {
      var testUser    = user.new('test', null, [], [{ Access: 'ADMIN', Resource: '**' }]);
      var userJson    = JSON.stringify(testUser.toJson());
      var cookieValue = new Buffer(userJson).toString('base64');
      return 'environmentmanager=' + cookieValue;
    }
  },
  startServer: function() {
    server.start();
  },
  stopServer: function() {
    server.stop();
  }
};
