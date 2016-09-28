/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assertContract = require('modules/assertContract');
let serviceReporter = require('modules/service-reporter');

module.exports = function GetAllNodes(query) {
  assertContract(query, 'query', {
    properties: {
      environment: { type: String, empty: false },
    },
  });

  return serviceReporter.getAllNodes(query.environment);
};
