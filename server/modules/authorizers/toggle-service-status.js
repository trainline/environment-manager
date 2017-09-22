/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let environments = require('modules/data-access/configEnvironments');
let services = require('modules/data-access/services');

module.exports = {
  getRules(request) {
    return co(function* () {
      let environmentName = request.swagger.params.environment.value;
      let environment = yield environments.get({ EnvironmentName: environmentName });

      let serviceName = request.swagger.params.service.value;
      let service = yield services.get({ ServiceName: serviceName });

      return [{
        resource: request.url.replace(/\/+$/, ''),
        access: request.method,
        clusters: [service.OwningCluster],
        environmentTypes: [environment.Value.EnvironmentType]
      }];
    });
  }
};
