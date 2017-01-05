/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let Expression = require('./awsDynamoExpression');
let Condition = require('./awsDynamoCondition');
let RequestHelper = require('./awsDynamoRequestHelper');

function UpdateRequestBuilder(parameters) {
  var $this = this;
  var $data = {
    table: parameters.table,
    key: parameters.key,
    range: parameters.range,
    version: parameters.version,
    expectedVersion: null,
    item: null,
  };

  this.item = function (item) {
    $data.item = item;
    return $this;
  };

  this.atVersion = function (expectedVersion) {
    $data.expectedVersion = expectedVersion;
    return $this;
  };

  this.buildRequest = function () {
    var request = {
      TableName: $data.table,
      Key: {},
    };

    var keyName         = $data.key;
    var rangeName       = $data.range;
    var versionName     = $data.version;
    var expectedVersion = $data.expectedVersion;

    var conditions  = [];
    var expressions = [];

    if (keyName) {
      var keyValue = $data.item[keyName];
      conditions.push(new Condition.Equal(keyName).to(keyValue));

      delete $data.item[keyName];
      request.Key[keyName] = keyValue;
    }

    if (rangeName) {
      var rangeValue = $data.item[rangeName];
      conditions.push(new Condition.Equal(rangeName).to(rangeValue));

      delete $data.item[rangeName];
      request.Key[rangeName] = rangeValue;
    }

    if (versionName) {

      expressions.push(new Expression.Add(versionName).to(1));

      if (expectedVersion) {
        conditions.push(new Condition.Equal(versionName).to(expectedVersion));
      }
    }

    for (var field in $data.item) {
      expressions.push(new Expression.Set(field).to($data.item[field]));
    }

    RequestHelper.addConditionExpression(request, conditions);
    RequestHelper.addUpdateExpression(request, expressions);

    return request;
  };

};

module.exports = UpdateRequestBuilder;
