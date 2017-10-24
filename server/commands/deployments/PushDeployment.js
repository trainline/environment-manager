/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let DeploymentCommandHandlerLogger = require('./DeploymentCommandHandlerLogger');
let sender = require('../../modules/sender');
let consulClient = require('../../modules/consul-client');
let serverRoleProvider = require('../../modules/deployment/serverRoleDefinition');
let serviceInstallationProvider = require('../../modules/deployment/serviceInstallationDefinition');
let serviceDefinitionProvider = require('../../modules/deployment/serviceDefinition');
let serviceDeploymentProvider = require('../../modules/deployment/serviceDeploymentDefinition');
let deploymentDefinitionProvider = require('../../modules/deployment/deploymentDefinition');

module.exports = function PushDeploymentCommandHandler(command) {
  const logger = new DeploymentCommandHandlerLogger(command);
  const deployment = command.deployment;
  const s3Path = command.s3Path;
  const expectedNodeDeployments = command.expectedNodeDeployments;

  return co(function* () {
    let consulConfig = yield consulClient.createConfig({ environment: deployment.environmentName });
    let dataCentre = consulConfig.defaults.dc;

    logger.info(`Updating consul metadata in data centre "${dataCentre}"`);

    let serviceDefinition = yield serviceDefinitionProvider.getKeyValue(deployment);
    let serverRoleDefinition = yield serverRoleProvider.getKeyValue(deployment);
    let serviceInstallation = yield serviceInstallationProvider.getKeyValue(deployment, s3Path);
    let deploymentDefinition = yield deploymentDefinitionProvider.getKeyValue(deployment);
    let serviceDeploymentDefinition = yield serviceDeploymentProvider.getKeyValue(deployment, expectedNodeDeployments);

    yield [
      updateTargetState(command, serviceDefinition),
      updateTargetState(command, serverRoleDefinition),
      updateTargetState(command, serviceInstallation),
      updateTargetState(command, deploymentDefinition),
      updateTargetState(command, serviceDeploymentDefinition)
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
