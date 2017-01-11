/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assertContract = require('modules/assertContract');
let DeploymentContract = require('modules/deployment/DeploymentContract');

module.exports = function ServiceDefinitionKeyValueProvider() {
  this.get = function (deployment) {
    assertContract(deployment, 'deployment', { type: DeploymentContract, null: false });

    let environmentName = deployment.environmentName;
    let environmentTypeName = deployment.environmentTypeName;
    let serviceName = deployment.serviceName;
    let serviceVersion = deployment.serviceVersion;
    let serviceSlice = deployment.serviceSlice;
    let clusterName = deployment.clusterName;

    let serviceId = getServiceId(environmentName, serviceName, serviceSlice);

    let serviceDefinitionKeyValue = {
      key: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/definition`,
      value: {
        Service: {
          Name: serviceId,
          ID: serviceId,
          Address: '',
          Port: 0,
          Tags: [
            `environment_type:${environmentTypeName}`,
            `environment:${environmentName}`,
            `owning_cluster:${clusterName}`,
            `version:${serviceVersion}`,
            // server_role and slice tags are set by Consul deployment agent
          ],
        },
      },
    };

    return Promise.resolve(serviceDefinitionKeyValue);
  };

  function getServiceId(environmentName, serviceName, serviceSlice) {
    let serviceId = [
      environmentName,
      serviceName,
      serviceSlice !== 'none' ? serviceSlice : null,
    ].filter(segment => !!segment)
      .join('-');

    return serviceId;
  }
};
