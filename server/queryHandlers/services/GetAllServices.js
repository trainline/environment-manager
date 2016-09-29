/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assertContract = require('modules/assertContract');
let serviceReporter = require('modules/service-reporter');
let bluebird = require('bluebird');
let _ = require('lodash');

module.exports = function GetAllServices(query) {
  let environments = _.castArray(query.environment);
  
  return bluebird.map(environments, environment =>
    serviceReporter.getAllServices(environment).then(services => ({[environment]:services})))
};

