/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let deployments = require('modules/data-access/deployments');
let ms = require('ms');
let DeploymentValidationError = require('modules/errors/DeploymentValidationError.class');

const DEPLOYMENT_MAXIMUM_THRESHOLD = ms('65m');

function validateServiceNotCurrentlyBeingDeployed(deployment) {
  let expectedStatus = 'In Progress';
  let query = {
    FilterExpression: ['and',
      ['=', ['at', 'Value', 'EnvironmentName'], ['val', deployment.environmentName]],
      ['=', ['at', 'Value', 'SchemaVersion'], ['val', 2]],
      ['=', ['at', 'Value', 'ServiceName'], ['val', deployment.serviceName]],
      ['=', ['at', 'Value', 'Status'], ['val', expectedStatus]]
    ]
  };

  return deployments.scanRunning(query).then((results) => {
    if (results.length) {
      let { serviceName: service, serverRoleName: role } = deployment;
      return Promise.reject(new DeploymentValidationError(
        `The '${service}' service is already being deployed to '${role}' at this time.`
      ));
    }

    return Promise.resolve();
  });
}

module.exports = {
  validate(deployment) {
    return Promise.all([
      validateServiceNotCurrentlyBeingDeployed(deployment)
    ]);
  }
};
