/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assertContract = require('modules/assertContract');
let serviceDiscovery = require('modules/service-discovery');

module.exports = function GetAllServices(query) {
  assertContract(query, 'query', {
    properties: {
      environment: { type: String, empty: false },
    },
  });

  return serviceDiscovery.getAllServices(query.query);
};
