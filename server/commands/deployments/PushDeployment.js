/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let sender = require('modules/sender');
let consulClient = require('modules/consul-client');

let serverRoleDefinition = require('modules/deployment/ServerRoleDefinitionKeyValueProvider.class');
let serviceInstallation = require('modules/deployment/ServiceInstallationKeyValueProvider.class');
let serviceDefinition = require('modules/deployment/ServiceDefinitionKeyValueProvider.class');
let deploymentService = require('modules/deployment/DeploymentServiceKeyValueProvider.class');
let deploymentDefinition = require('modules/deployment/DeploymentKeyValueProvider.class');

module.exports = function PushDeploymentCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);
  let deployment = command.deployment;
  let s3Path = command.s3Path;

  return co(function* () {
    let consulConfig = yield consulClient.createConfig({ environment: deployment.environmentName });
    let dataCentre = consulConfig.defaults.dc;

    logger.info(`Updating consul metadata in data centre "${dataCentre}"`);

    let keyValues = yield {
      serviceDefinition: yield serviceDefinition.getKeyValue(deployment),
      serverRoleDefinition: yield serverRoleDefinition.getKeyValue(deployment),
      serviceInstallation: yield serviceInstallation.getKeyValue(deployment, s3Path),
      deployment: yield deploymentDefinition.getKeyValue(deployment),
      deploymentService: yield deploymentService.getKeyValue(deployment)
    };

    yield [
      updateTargetState(command, keyValues.serviceDefinition),
      updateTargetState(command, keyValues.serverRoleDefinition),
      updateTargetState(command, keyValues.serviceInstallation),
      updateTargetState(command, keyValues.deployment),
      updateTargetState(command, keyValues.deploymentService)
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
      options
    },
    parent: command
  });
}
