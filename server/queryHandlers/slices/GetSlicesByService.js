/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let getSlices = require('../../modules/queryHandlersUtil/getSlices');
let loadBalancerUpstreams = require('../../modules/data-access/loadBalancerUpstreams');

module.exports = function GetSlicesByService(query) {
  assert.equal(typeof query.environmentName, 'string');
  assert.equal(typeof query.serviceName, 'string');

  return loadBalancerUpstreams.inEnvironmentWithService(query.environmentName, query.serviceName)
    .then(upstreams => getSlices.handleQuery(query, upstreams));
};
