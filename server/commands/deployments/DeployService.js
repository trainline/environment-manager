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
let _ = require('lodash');
let SupportedSliceNames = _.values(Enums.SliceName);
let SupportedDeploymentModes = _.values(Enums.DeploymentMode);
let validUrl = require('valid-url');
let s3PackageLocator = require('modules/s3PackageLocator');
let EnvironmentHelper = require('models/Environment');
let ResourceLockedError = require('modules/errors/ResourceLockedError');
let autoScalingTemplatesProvider = require('modules/provisioning/autoScalingTemplatesProvider');
let DynamoHelperLoader = require('api/api-utils/DynamoHelperLoader');
let getExpectedState = require('modules/scheduling/getExpectedState');
let getScheduleStateByAsg = require('modules/scheduling/getScheduleStateByAsg');
let getScheduleByEnvironment = require('modules/scheduling/getScheduleByEnvironment');
let getAsg = require('queryHandlers/GetAutoScalingGroup');

module.exports = function DeployServiceCommandHandler(command) {
  assertContract(command, 'command', {
    properties: {
      environmentName: { type: String, empty: false },
      serviceName: { type: String, empty: false },
      serviceVersion: { type: String, empty: false },
      serviceSlice: { type: String, empty: false },
      mode: { type: String, empty: false },
      serverRoleName: { type: String, empty: false }
    }
  });

  return co(function* () {
    let deployment = yield validateCommandAndCreateDeployment(command);
    let destination = yield packagePathProvider.getS3Path(deployment);
    let sourcePackage = getSourcePackageByCommand(command);
    let environmentName = deployment.environmentName;
    let serviceName = deployment.serviceName;
    let serverRoleName = deployment.serverRoleName;
    let accountName = deployment.accountName;
    let configuration = yield infrastructureConfigurationProvider.get(
      environmentName, serviceName, serverRoleName
    );
    let DynamoHelper = DynamoHelperLoader.load();
    let environmentTable = new DynamoHelper('ops/environments');
    let templates = yield autoScalingTemplatesProvider.get(
      configuration, accountName
    );

    if (Array.isArray(templates)) {
      let autoScalingGroupName = templates[0].autoScalingGroupName;
      yield getAsg({ accountName, autoScalingGroupName })
        .then((asg) => {
          checkAsgSchedule(asg);
        })
        .catch((e) => {
          // May not have an ASG associated with it.
          // That's fine.
        });
    }

    let environment = yield environmentTable.getByKey(environmentName);

    if (environment) {
      checkEnvironmentSchedule(environment);
    }

    if (command.isDryRun) {
      return {
        isDryRun: true,
        packagePath: command.packagePath
      };
    }

    // Run asynchronously, we don't wait for deploy to finish intentionally
    deploy(deployment, destination, sourcePackage, command);

    yield deploymentLogger.started(deployment, deployment.accountName);
    return deployment;
  });
};

function checkAsgSchedule(asg) {
  let state = getScheduleStateByAsg(asg);
  if (state && state.toLowerCase() === 'off') {
    throw new Error('The state of this ASG schedule is off.');
  }
}

function checkEnvironmentSchedule(environment) {
  let environmentSchedule = getScheduleByEnvironment(environment);
  let environmentScheduleState;

  if (environmentSchedule && environmentSchedule.parseResult) {
    if (Array.isArray(environmentSchedule.parseResult.schedule)) {
      environmentScheduleState = getExpectedState.fromMultipleEnvironmentSchedules(environmentSchedule.parseResult.schedule);
    } else {
      environmentScheduleState = getExpectedState.fromSingleEnvironmentSchedule(environmentSchedule.parseResult);
    }
  }

  if (environmentScheduleState) {
    if (environmentScheduleState.toLowerCase() === 'off') {
      throw new Error('The state for the environment schedule is off.');
    }
  }
}

function validateCommandAndCreateDeployment(command) {
  return co(function* () {
    const { mode, packagePath, environmentName, serviceSlice, serviceName, serviceVersion } = command;

    if (mode === 'overwrite' && serviceSlice !== undefined && serviceSlice !== 'none') {
      throw new Error('Slice must be set to \'none\' in overwrite mode.');
    }
    if (SupportedDeploymentModes.indexOf(mode.toLowerCase()) < 0) {
      throw new Error(`Unknown mode \'${mode}\'. Supported modes are: ${SupportedDeploymentModes.join(', ')}`);
    }
    if (mode === 'bg' && SupportedSliceNames.indexOf(serviceSlice) < 0) {
      throw new Error(`Unknown slice \'${serviceSlice}\'. Supported slices are: ${SupportedSliceNames.join(', ')}`);
    }

    if (!packagePath) {
      let s3Package;
      try {
        s3Package = yield s3PackageLocator.findDownloadUrl({
          environment: environmentName,
          service: serviceName,
          version: serviceVersion
        });
      } catch (error) {
        throw new Error(`An attempt to locate the following package in S3 was forbidden: ${serviceName} version ${serviceVersion}`);
      }

      if (!s3Package) {
        throw new Error('Deployment package was not found. Please specify a location or upload the package to S3');
      } else {
        command.packagePath = s3Package;
      }
    }

    command.packageType = validUrl.isUri(packagePath) ?
      Enums.SourcePackageType.CodeDeployRevision :
      Enums.SourcePackageType.DeploymentMap;

    const environment = yield EnvironmentHelper.getByName(command.environmentName);
    const environmentType = yield environment.getEnvironmentType();
    command.accountName = environmentType.AWSAccountName;

    if (environment.IsLocked) {
      throw new ResourceLockedError(`The environment ${environmentName} is currently locked for deployments. Contact the environment owner.`);
    }

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
      serverRole: roleName,
      serverRoleName: command.serverRoleName,
      clusterName: configuration.cluster.Name,
      accountName: command.accountName,
      username: command.username
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
      accountName: deployment.accountName
    };

    let newStatus = {
      name: Enums.DEPLOYMENT_STATUS.Failed,
      reason: sanitiseError(error)
    };

    deploymentLogger.updateStatus(deploymentStatus, newStatus);
    throw error;
  });
}

function sanitiseError(error) {
  if (_.isObjectLike(error)) { return JSON.stringify(error); }
  return error.toString(true);
}

function provideInfrastructure(accountName, deployment, parentCommand) {
  let command = {
    name: 'ProvideInfrastructure',
    accountName,
    deployment
  };

  return sender.sendCommand({ command, parent: parentCommand });
}

function preparePackage(accountName, destination, source, parentCommand) {
  let command = {
    name: 'PreparePackage',
    accountName,
    destination,
    source
  };

  return sender.sendCommand({ command, parent: parentCommand });
}

function pushDeployment(accountName, deployment, s3Path, parentCommand) {
  let command = {
    name: 'PushDeployment',
    accountName,
    deployment,
    s3Path
  };

  return sender.sendCommand({ command, parent: parentCommand });
}

function getSourcePackageByCommand(command) {
  switch (command.packageType) {
    case Enums.SourcePackageType.CodeDeployRevision:
      return {
        type: Enums.SourcePackageType.CodeDeployRevision,
        url: command.packagePath
      };
    case Enums.SourcePackageType.DeploymentMap:
      return {
        type: Enums.SourcePackageType.DeploymentMap,
        id: command.packagePath,
        version: command.serviceVersion
      };
    default:
      throw new UnknownSourcePackageTypeError(`Unknown "${command.sourcePackageType}" source package type.`);
  }
}
