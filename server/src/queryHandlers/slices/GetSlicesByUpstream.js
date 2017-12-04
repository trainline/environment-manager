/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let getSlices = require('../../modules/queryHandlersUtil/getSlices');
let loadBalancerUpstreams = require('../../modules/data-access/loadBalancerUpstreams');

module.exports = function GetSlicesByUpstream(query) {
  assert.equal(typeof query.environmentName, 'string');
  assert.equal(typeof query.upstreamName, 'string');

  return loadBalancerUpstreams.inEnvironmentWithUpstream(query.environmentName, query.upstreamName)
    .then(upstreams => getSlices.handleQuery(query, upstreams));
};
