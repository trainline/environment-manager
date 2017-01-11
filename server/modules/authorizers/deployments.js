/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let deploymentsHelper = require('modules/queryHandlersUtil/deployments-helper');

module.exports = {
  getRules(request) {
    return co(function* () {
      let key = request.swagger.params.id.value;
      let deployment = yield deploymentsHelper.get({ key });

      return [{
        resource: request.url.replace(/\/+$/, ''),
        access: request.method,
        clusters: [deployment.Value.OwningCluster],
        environmentTypes: [deployment.Value.EnvironmentType],
      }];
    });
  },
};
