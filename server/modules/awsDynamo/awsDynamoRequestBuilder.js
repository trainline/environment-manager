/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let Expression = require('./awsDynamoExpression');
let Condition = require('./awsDynamoCondition');
let InsertRequestBuilder = require('./awsDynamoInsertRequestBuilder');
let UpdateRequestBuilder = require('./awsDynamoUpdateRequestBuilder');
let ScanRequestBuilder = require('./awsDynamoScanRequestBuilder');

function RequestBuilder(parameters) {

  var $data = {
    table:     parameters.table,
    key:       parameters.key,
    range:     parameters.range,
    version:   parameters.version,
    dateField: parameters.dateField,
  };

  this.getTable = function () { return $data.table; };
  this.getKey = function () { return $data.key; };
  this.getRange = function () { return $data.range; };
  this.getVersion = function () { return $data.version; };

  this.scan = function () {
    return new ScanRequestBuilder($data);
  };

  this.insert = function () {
    return new InsertRequestBuilder($data);
  };

  this.update = function () {
    return new UpdateRequestBuilder($data);
  };

};

module.exports = RequestBuilder;
