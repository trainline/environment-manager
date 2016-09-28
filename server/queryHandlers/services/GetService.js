/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assertContract = require('modules/assertContract');
let serviceReporter = require('modules/service-reporter');

module.exports = function GetService(query) {
  assertContract(query, 'query', {
    properties: {
      accountName: { type: String, empty: false },
      environment: { type: String, empty: false },
      serviceName: { type: String, empty: false },
    },
  });

  // let service = `${query.environment}-${query.serviceName}`;
  // let tag = `environment:${query.environment}`;
  return serviceReporter.getService(query.environment, query.serviceName);
};
