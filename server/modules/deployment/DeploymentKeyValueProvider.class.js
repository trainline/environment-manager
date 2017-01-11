/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assertContract = require('modules/assertContract');
let DeploymentContract = require('modules/deployment/DeploymentContract');

module.exports = function DeploymentKeyValueProvider() {
  this.get = function (deployment) {
    assertContract(deployment, 'deployment', { type: DeploymentContract, null: false });
    let deploymentId = deployment.id;
    let deploymentKeyValue = {
      key: `deployments/${deploymentId}/overall_status`,
      value: 'In Progress',
    };

    return Promise.resolve(deploymentKeyValue);
  };
};
