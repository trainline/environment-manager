/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assertContract = require('modules/assertContract');
let DeploymentContract = require('modules/deployment/DeploymentContract');
let Enums = require('Enums');

module.exports = function ServerRoleDefinitionKeyValueProvider() {
  this.get = function (deployment) {
    assertContract(deployment, 'deployment', { type: DeploymentContract, null: false });

    let deploymentId = deployment.id;
    let environmentName = deployment.environmentName;
    let serviceName = deployment.serviceName;
    let serviceVersion = deployment.serviceVersion;
    let serviceSlice = deployment.serviceSlice;
    let serverRole = deployment.serverRole;

    let key = serviceSlice ?
      `environments/${environmentName}/roles/${serverRole}/services/${serviceName}/${serviceSlice}` :
      `environments/${environmentName}/roles/${serverRole}/services/${serviceName}`;

    let serverRoleDefinitionKeyValue = {
      key,
      value: {
        Name: serviceName,
        Version: serviceVersion,
        Slice: serviceSlice || 'none',
        DeploymentId: deploymentId,
        InstanceIds: [],
        Action: Enums.ServiceAction.INSTALL,
      },
    };

    return Promise.resolve(serverRoleDefinitionKeyValue);
  };
};
