/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Expression = require('./awsDynamoExpression');
let Condition = require('./awsDynamoCondition');
let RequestHelper = require('./awsDynamoRequestHelper');

function UpdateRequestBuilder(parameters) {
  let $this = this;
  let $data = {
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
    let request = {
      TableName: $data.table,
      Key: {},
    };

    let keyName = $data.key;
    let rangeName = $data.range;
    let versionName = $data.version;
    let expectedVersion = $data.expectedVersion;

    let conditions = [];
    let expressions = [];

    if (keyName) {
      let keyValue = $data.item[keyName];
      conditions.push(new Condition.Equal(keyName).to(keyValue));

      delete $data.item[keyName];
      request.Key[keyName] = keyValue;
    }

    if (rangeName) {
      let rangeValue = $data.item[rangeName];
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

    for (let field in $data.item) {
      expressions.push(new Expression.Set(field).to($data.item[field]));
    }

    RequestHelper.addConditionExpression(request, conditions);
    RequestHelper.addUpdateExpression(request, expressions);

    return request;
  };
}

module.exports = UpdateRequestBuilder;
