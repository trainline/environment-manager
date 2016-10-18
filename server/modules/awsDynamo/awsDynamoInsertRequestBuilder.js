/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Expression = require('./awsDynamoExpression');
let Condition = require('./awsDynamoCondition');
let RequestHelper = require('./awsDynamoRequestHelper');

function InsertRequestBuilder(parameters) {
  let $this = this;
  let $data = {
    table: parameters.table,
    key: parameters.key,
    range: parameters.range,
    version: parameters.version,
    item: null,
  };

  this.item = function (item) {
    $data.item = item;
    return $this;
  };

  this.buildRequest = function () {
    let request = {
      TableName: $data.table,
      Item: $data.item,
    };

    let conditions = [];

    let key = $data.key;
    if (key) conditions.push(new Condition.NotEqual(key).to($data.item[key]));

    let range = $data.range;
    if (range) conditions.push(new Condition.NotEqual(range).to($data.item[range]));

    RequestHelper.addConditionExpression(request, conditions);

    return request;
  };
}

module.exports = InsertRequestBuilder;
