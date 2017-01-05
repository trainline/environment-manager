/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assertContract = require('modules/assertContract');
let DeploymentContract = require('modules/deployment/DeploymentContract');

module.exports = function DeploymentServiceKeyValueProvider() {
  this.get = function (deployment) {
    assertContract(deployment, 'deployment', { type: DeploymentContract, null: false });

    var environmentName = deployment.environmentName;
    var serviceName = deployment.serviceName;
    var serviceVersion = deployment.serviceVersion;
    var deploymentId = deployment.id;

    var deploymentServiceKeyValue = {
      key: `deployments/${deploymentId}/service`,
      value: {
        Name: serviceName,
        Version: serviceVersion,
        ServerRole: deployment.serverRole,
        Environment: environmentName,
        Action: 'Install',
      },
    };

    return Promise.resolve(deploymentServiceKeyValue);
  };
};
