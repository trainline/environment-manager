/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let Enums = require('Enums');
let co = require('co');
let serviceDiscovery = require('modules/service-discovery');
let GetServerRoles = require('queryHandlers/services/GetServerRoles');

function* getServiceHealth({ environmentName, serviceName }) {
  let service = yield serviceDiscovery.getService(environmentName, serviceName);
  let serviceRoles = (yield GetServerRoles({ environmentName })).Value;

  return serviceRoles;
}

module.exports = co.wrap(getServiceHealth);