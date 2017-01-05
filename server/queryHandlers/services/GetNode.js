/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assertContract = require('modules/assertContract');
let serviceDiscovery = require('modules/service-discovery');

module.exports = function GetNode(query) {
  assertContract(query, 'query', {
    properties: {
      environment: { type: String, empty: false },
      nodeName: { type: String, empty: false },
    },
  });

  return serviceDiscovery.getNode(query.environment, query.nodeName);
};
