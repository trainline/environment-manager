/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let getSlices = require('modules/queryHandlersUtil/getSlices');
const FILTER = getSlices.FILTER;
const QUERYING = getSlices.QUERYING;

module.exports = function GetSlicesByUpstream(query) {
  assert.equal(typeof query.accountName, 'string');
  assert.equal(typeof query.environmentName, 'string');
  assert.equal(typeof query.upstreamName, 'string');

  return getSlices.handleQuery(query,
    QUERYING.upstream.byUpstreamName(query),
    FILTER.upstream.byUpstreamName(query),
    FILTER.host.allSlices());
};
