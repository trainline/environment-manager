/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let getSlices = require('modules/queryHandlersUtil/getSlices');
const FILTER = getSlices.FILTER;
const QUERYING = getSlices.QUERYING;

module.exports = function GetSlicesByService(query) {
  assert.equal(typeof query.accountName, 'string');
  assert.equal(typeof query.environmentName, 'string');
  assert.equal(typeof query.serviceName, 'string');

  return getSlices.handleQuery(query,
    QUERYING.upstream.byServiceName(query),
    FILTER.upstream.byServiceName(query),
    FILTER.host.allSlices());
};
