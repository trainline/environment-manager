/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let assertContract = require('modules/assertContract');
let deploymentsHelper = require('modules/queryHandlersUtil/deployments-helper');

class Deployment {

  constructor(data) {
    assertContract(data, 'DeploymentContract', {
      properties: {
        id: { type: String, empty: false },
        environmentTypeName: { type: String, empty: false },
        environmentName: { type: String, empty: false },
        serverRole: { type: String, empty: false },
        serverRoleName: { type: String, empty: false },
        serviceName: { type: String, empty: false },
        serviceVersion: { type: String, empty: false },
        serviceSlice: { type: String, empty: true },
        clusterName: { type: String, empty: false },
        accountName: { type: String, empty: false },
        username: { type: String, empty: false },
      },
    });

    _.assign(this, data);
  }

  getById(key, account) {
    return deploymentsHelper.get({ key, account })
  }
  
}

module.exports = Deployment;