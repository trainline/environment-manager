/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let co = require('co');
let getSlices = require('modules/queryHandlersUtil/getSlices');
let Environment = require('models/Environment');

const FILTER = getSlices.FILTER;
const QUERYING = getSlices.QUERYING;

function* GetSlicesByUpstream(query) {
  assert.equal(typeof query.upstreamName, 'string');
  let upstream = Upstream.getByName(query.upstreamName);

  query.environmentName = yield upstream.getEnvironmentName();
  query.accountName = yield Environment.getAccountNameForEnvironment(query.environmentName);

  return getSlices.handleQuery(query,
    QUERYING.upstream.byUpstreamName(query),
    FILTER.upstream.byUpstreamName(query),
    FILTER.host.allSlices());
}

module.exports = co.wrap(GetSlicesByUpstream);