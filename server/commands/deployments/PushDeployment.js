/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let configurationCache = require('modules/configurationCache');
let assertContract = require('modules/assertContract');
let S3PathContract = require('modules/deployment/S3PathContract');
let DeploymentContract = require('modules/deployment/DeploymentContract');
let sender = require('modules/sender');
let consulClient = require('modules/consul-client');

let serverRoleDefinitionKeyValueProvider = new (require('modules/deployment/ServerRoleDefinitionKeyValueProvider.class'))();
let serviceInstallationKeyValueProvider = new (require('modules/deployment/ServiceInstallationKeyValueProvider.class'))();
let serviceDefinitionKeyValueProvider = new (require('modules/deployment/ServiceDefinitionKeyValueProvider.class'))();
let deploymentServiceKeyValueProvider = new (require('modules/deployment/DeploymentServiceKeyValueProvider.class'))();
let deploymentKeyValueProvider = new (require('modules/deployment/DeploymentKeyValueProvider.class'))();

module.exports = function PushDeploymentCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  assertContract(command, 'command', {
    properties: {
      s3Path: { type: S3PathContract, null: false },
      deployment: { type: DeploymentContract, null: false },
    },
  });

  let deployment = command.deployment;
  let s3Path = command.s3Path;

  return co(function* () {
    let consulConfig = yield consulClient.createConfig({ environment: deployment.environmentName });
    let dataCentre = consulConfig.defaults.dc;

    logger.info(`Updating consul metadata in data centre "${dataCentre}"`);

    let keyValues = yield {
      serviceDefinition: yield serviceDefinitionKeyValueProvider.get(deployment),
      serverRoleDefinition: yield serverRoleDefinitionKeyValueProvider.get(deployment),
      serviceInstallation: yield serviceInstallationKeyValueProvider.get(deployment, s3Path),
      deployment: yield deploymentKeyValueProvider.get(deployment),
      deploymentService: yield deploymentServiceKeyValueProvider.get(deployment),
    };

    yield [
      updateTargetState(command, keyValues.serviceDefinition),
      updateTargetState(command, keyValues.serverRoleDefinition),
      updateTargetState(command, keyValues.serviceInstallation),
      updateTargetState(command, keyValues.deployment),
      updateTargetState(command, keyValues.deploymentService),
    ];

    logger.info('Consul metadata has been updated');
  }).catch((error) => {
    logger.error('An error has occurred updating consul metadata', error);
    return Promise.reject(error);
  });
};

function updateTargetState(command, keyValue, options) {
  return sender.sendCommand({
    command: {
      name: 'UpdateTargetState',
      environment: command.deployment.environmentName,
      key: keyValue.key,
      value: keyValue.value,
      options,
    },
    parent: command,
  });
}
