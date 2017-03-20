/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function getKeyValue(deployment) {
  let deploymentId = deployment.id;
  let deploymentKeyValue = {
    key: `deployments/${deploymentId}/overall_status`,
    value: 'In Progress'
  };

  return Promise.resolve(deploymentKeyValue);
}

module.exports = {
  getKeyValue
};
