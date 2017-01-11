/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let Enums = require('Enums');
let assertContract = require('modules/assertContract');

let DeploymentContract = require('modules/deployment/DeploymentContract');
let UnknownSourcePackageTypeError = require('modules/errors/UnknownSourcePackageTypeError.class');

let sender = require('modules/sender');
let infrastructureConfigurationProvider = require('modules/provisioning/infrastructureConfigurationProvider');
let namingConventionProvider = require('modules/provisioning/namingConventionProvider');
let packagePathProvider = new (require('modules/PackagePathProvider'))();
let deploymentLogger = require('modules/DeploymentLogger');

module.exports = function DeployServiceCommandHandler(command) {
  assertContract(command, 'command', {
    properties: {
      accountName: { type: String, empty: false },
      environmentName: { type: String, empty: false },
      serviceName: { type: String, empty: false },
      serviceVersion: { type: String, empty: false },
      serviceSlice: { type: String, empty: false },
      packageType: { type: String, empty: false },
      packagePath: { type: String, empty: false },
      serverRoleName: { type: String, empty: false },
    },
  });

  return co(function* () {
    let deployment = yield validateCommandAndCreateDeployment(command);
    let destination = yield packagePathProvider.getS3Path(deployment);
    let sourcePackage = getSourcePackageByCommand(command);

    // Run asynchronously, we don't wait for deploy to finish intentionally
    deploy(deployment, destination, sourcePackage, command);
    let accountName = deployment.accountName;
    yield deploymentLogger.started(deployment, accountName);
    return deployment;
  });
};

function validateCommandAndCreateDeployment(command) {
  return co(function* () {
    let configuration = yield infrastructureConfigurationProvider.get(
      command.environmentName, command.serviceName, command.serverRoleName
    );

    let roleName = namingConventionProvider.getRoleName(configuration, command.serviceSlice);
    let deploymentContract = new DeploymentContract({
      id: command.commandId,
      environmentTypeName: configuration.environmentTypeName,
      environmentName: command.environmentName,
      serviceName: command.serviceName,
      serviceVersion: command.serviceVersion,
      serviceSlice: command.serviceSlice || '',
      serverRole: roleName, // TODO(filip): rename this to "serverRoleRuntimeName"
      serverRoleName: command.serverRoleName,
      clusterName: configuration.cluster.Name,
      accountName: command.accountName,
      username: command.username,
    });

    yield deploymentContract.validate(configuration);
    return deploymentContract;
  });
}

function deploy(deployment, destination, sourcePackage, command) {
  return co(function* () {
    let accountName = deployment.accountName;
    yield provideInfrastructure(accountName, deployment, command);
    yield preparePackage(accountName, destination, sourcePackage, command);
    yield pushDeployment(accountName, deployment, destination, command);
    deploymentLogger.inProgress(
      deployment.id,
      deployment.accountName,
      'Waiting for nodes to perform service deployment...'
    );
  }).catch((error) => {
    let deploymentStatus = {
      deploymentId: deployment.id,
      accountName: deployment.accountName,
    };

    let newStatus = {
      name: Enums.DEPLOYMENT_STATUS.Failed,
      reason: error.toString(true),
    };

    deploymentLogger.updateStatus(deploymentStatus, newStatus);
    throw error;
  });
}

function provideInfrastructure(accountName, deployment, parentCommand) {
  let command = {
    name: 'ProvideInfrastructure',
    accountName,
    deployment,
  };

  return sender.sendCommand({ command, parent: parentCommand });
}

function preparePackage(accountName, destination, source, parentCommand) {
  let command = {
    name: 'PreparePackage',
    accountName,
    destination,
    source,
  };

  return sender.sendCommand({ command, parent: parentCommand });
}

function pushDeployment(accountName, deployment, s3Path, parentCommand) {
  let command = {
    name: 'PushDeployment',
    accountName,
    deployment,
    s3Path,
  };

  return sender.sendCommand({ command, parent: parentCommand });
}

function getSourcePackageByCommand(command) {
  switch (command.packageType) {
    case Enums.SourcePackageType.CodeDeployRevision:
      return {
        type: Enums.SourcePackageType.CodeDeployRevision,
        url: command.packagePath,
      };
    case Enums.SourcePackageType.DeploymentMap:
      return {
        type: Enums.SourcePackageType.DeploymentMap,
        id: command.packagePath,
        version: command.serviceVersion,
      };
    default:
      throw new UnknownSourcePackageTypeError(`Unknown "${command.sourcePackageType}" source package type.`);
  }
}
