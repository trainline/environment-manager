/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assertContract = require('modules/assertContract');
let serviceReporter = require('modules/service-reporter');
let bluebird = require('bluebird');
let _ = require('lodash');

module.exports = function GetService(query) {
  let environments = _.castArray(query.environment);

  return bluebird.map(environments, function(environment) {
    let service = `${environment}-${query.serviceName}`;
    let tag = `environment:${environment}`;
    return serviceReporter.getService(environment, { service, tag }).then(service => ({[environment]:service}));
  })
};
