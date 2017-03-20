/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function getKeyValue(deployment, expectedNodeDeployments) {
  let environmentName = deployment.environmentName;
  let serviceName = deployment.serviceName;
  let serviceVersion = deployment.serviceVersion;
  let deploymentId = deployment.id;

  let deploymentServiceKeyValue = {
    key: `deployments/${deploymentId}/service`,
    value: {
      Name: serviceName,
      Version: serviceVersion,
      ServerRole: deployment.serverRole,
      Environment: environmentName,
      Action: 'Install',
      ExpectedNodeDeployments: expectedNodeDeployments
    }
  };

  return Promise.resolve(deploymentServiceKeyValue);
}

module.exports = {
  getKeyValue
};
