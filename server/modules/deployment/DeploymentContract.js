/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let deploymentValidators = require('modules/deployment/deploymentValidators');
let assertContract = require('modules/assertContract');
let _ = require('lodash');

class DeploymentContract {

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

  validate(configuration) {
    // Checking deployment is valid through all validators otherwise return a rejected promise
    return deploymentValidators.map(validator => validator.validate(this, configuration));
  }

}


module.exports = DeploymentContract;