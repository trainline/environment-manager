/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let logger = require('modules/logger');
let ms = require('ms');
let sender = require('modules/sender');
let utils = require('modules/utilities');
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
  let minimumRangeDate = utils.offsetMilliseconds(new Date(), -DEPLOYMENT_MAXIMUM_THRESHOLD).toISOString();
  let maximumRangeDate = new Date().toISOString();
  let query = {
    name: 'ScanCrossAccountDynamoResources',
    resource: 'deployments/history',
    filter: {
      'Value.Status': expectedStatus,
      'Value.EnvironmentName': deployment.environmentName,
      'Value.ServiceName': deployment.serviceName,
      'Value.ServerRoleName': deployment.serverRoleName,
      $date_from: minimumRangeDate,
      $date_to: maximumRangeDate,
      'Value.SchemaVersion': 2,
    },
  };

  return sender.sendQuery({ query }).then(deployments => {
    if (deployments.length) {
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
    key: `environments/${environment}/services/${service}/${version}/definition`,
  };

  return sender.sendQuery({ query })
    .then((deployedService) => {
      if (canDeployToSlice(slice, deployedService)) {
      } else {
        let message = 'Each version of a service may only be deployed to slices of one colour per environment.'
          + ` You attempted to deploy ${service} ${version} to a ${slice} slice of ${environment}.`
          + ' Perhaps it is already deployed to another slice in this environment?';
        deploymentLogger.inProgress(deployment.id, deployment.accountName, message);
      }
      return Promise.resolve();
    });
}

module.exports = {
  validate(deployment) {
    return Promise.all([
      validateServiceNotCurrentlyBeingDeployed(deployment),
      validateServiceAndVersionNotDeployed(deployment),
    ]);
  },
};
