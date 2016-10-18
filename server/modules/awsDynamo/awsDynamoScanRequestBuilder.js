/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let Expression = require('./awsDynamoExpression');
let Condition = require('./awsDynamoCondition');
let RequestHelper = require('./awsDynamoRequestHelper');

let DATE_FORMAT = {
  ISO: 'ISO',
  UNIX: 'UNIX',
};

function tryParseDate(value, format) {
  if (!value) return null;

  let date = new Date(value);
  if (date === 0) return new Date();
  if (date === 'Invalid Date') return new Date();

  return format === DATE_FORMAT.ISO ? date.toISOString() : date.getTime();
}

function ScanRequestBuilder(parameters) {
  let DATE_FROM_FIELD = '$date_from';
  let DATE_TO_FIELD = '$date_to';

  assert(parameters,
    'Argument "parameters" cannot be null.');

  assert(parameters.table,
    'Argument "parameters.table" cannot be null or empty.');

  if (parameters.dateField) {
    assert(parameters.dateField.name,
      'Argument "parameters.dateField.name" cannot be null or empty.');

    assert(parameters.dateField.format,
      'Argument "parameters.dateField.format" cannot be null or empty.');

    assert(parameters.dateField.format === DATE_FORMAT.ISO || parameters.dateField.format === DATE_FORMAT.UNIX,
      `Argument "parameters.dateField.format" value can be "ISO" or "UNIX" only. Current value: ${parameters.dateField.format}`);
  }

  let $this = this;
  let $data = {
    table: parameters.table,
    key: parameters.key,
    range: parameters.range,
    dateField: parameters.dateField,
    filter: null,
    resultsLimit: null,
  };

  this.filterBy = function (filter) {
    $data.filter = filter;
    return $this;
  };

  this.limitTo = function (resultsLimit) {
    $data.resultsLimit = resultsLimit;
    return $this;
  };

  this.buildRequest = function () {
    let request = {
      TableName: $data.table,
    };

    if ($data.filter) {
      let filters = [];

      for (let field in $data.filter) {
        switch (field.toLowerCase()) {
          case DATE_FROM_FIELD:
            let dateFrom = tryParseDate($data.filter[field], $data.dateField.format);
            if (!dateFrom) continue;
            filters.push(new Condition.GreaterOrEqual($data.dateField.name).than(dateFrom));
            break;
          case DATE_TO_FIELD:
            let dateTo = tryParseDate($data.filter[field], $data.dateField.format);
            if (!dateTo) continue;
            filters.push(new Condition.LessOrEqual($data.dateField.name).than(dateTo));
            break;
          default:
            filters.push(new Condition.Equal(field).to($data.filter[field]));
            break;
        }
      }

      RequestHelper.addFilterExpression(request, filters);
    }

    if ($data.resultsLimit !== null) {
      RequestHelper.addResultsLimit(request, $data.resultsLimit);
    }

    return request;
  };
}

module.exports = ScanRequestBuilder;
