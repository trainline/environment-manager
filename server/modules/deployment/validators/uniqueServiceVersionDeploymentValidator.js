/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let deployments = require('modules/data-access/deployments');
let logger = require('modules/logger');
let ms = require('ms');
let sender = require('modules/sender');
let DeploymentValidationError = require('modules/errors/DeploymentValidationError.class');
let deploymentLogger = require('modules/DeploymentLogger');

const DEPLOYMENT_MAXIMUM_THRESHOLD = ms('65m');

function canDeployToSlice(targetSlice, deployedService) {
  try {
    let resultCount = deployedService.length;
    if (resultCount === 1) {
      /* This version is installed. Allow the deployment to continue
       * if this version is currently deployed to the same slice we
       * are attempting to deploy to */
      let tags = deployedService[0].value.Service.Tags;
      return tags.some(tag => tag === `slice:${targetSlice}`);
    } else if (resultCount < 1) {
      // This version is not currently installed.
      return true;
    } else {
      // The desired state is broken!
      logger.error(new Error(`Expected one Consul key but found ${resultCount}.`));
      return false;
    }
  } catch (error) {
    logger.error(error);
    return false;
  }
}

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
      return Promise.reject(new DeploymentValidationError(
        `The '${deployment.serviceName}' service is already being deployed to '${deployment.serverRoleName}' at this time.`
      ));
    }

    return Promise.resolve();
  });
}

function validateServiceAndVersionNotDeployed(deployment) {
  let environment = deployment.environmentName;
  let service = deployment.serviceName;
  let version = deployment.serviceVersion;
  let slice = deployment.serviceSlice;

  let query = {
    name: 'GetTargetState',
    environment,
    recurse: true,
    key: `environments/${environment}/services/${service}/${version}/definition`
  };

  return sender.sendQuery({ query })
    .then((deployedService) => {
      if (!canDeployToSlice(slice, deployedService)) {
        let message = 'Each version of a service may only be deployed to slices of one colour per environment.'
          + ` You attempted to deploy ${service} ${version} to a ${slice} slice of ${environment}.`
          + ' Perhaps it is already deployed to another slice in this environment?';
        deploymentLogger.inProgress(deployment.id, message);
      }
      return Promise.resolve();
    });
}

module.exports = {
  validate(deployment) {
    return Promise.all([
      validateServiceNotCurrentlyBeingDeployed(deployment),
      validateServiceAndVersionNotDeployed(deployment)
    ]);
  }
};
