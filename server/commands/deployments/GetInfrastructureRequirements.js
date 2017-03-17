/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';


let co = require('co');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let DeploymentValidationError = require('modules/errors/DeploymentValidationError.class');
let launchConfigurationTemplatesProvider = require('modules/provisioning/launchConfigurationTemplatesProvider');
let infrastructureConfigurationProvider = require('modules/provisioning/infrastructureConfigurationProvider');
let autoScalingTemplatesProvider = require('modules/provisioning/autoScalingTemplatesProvider');
let sender = require('modules/sender');
let _ = require('lodash');

module.exports = function GetInfrastructureRequirements(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  return co(function* () {
    let deployment = command.deployment;
    let environmentName = deployment.environmentName;
    let serviceName = deployment.serviceName;
    let accountName = deployment.accountName;
    let slice = deployment.serviceSlice;
    let requiredInfra = { asgsToCreate: [], launchConfigsToCreate: [] };

    logger.info('Reading infrastructure configuration...');

    let configuration = yield infrastructureConfigurationProvider.get(
      environmentName, serviceName, deployment.serverRoleName
    );

    let asgsToCreate = yield getASGsToCreate(
      logger, configuration, accountName, slice
    );

    if (!asgsToCreate.length) return requiredInfra;

    requiredInfra.asgsToCreate = asgsToCreate;
    requiredInfra.launchConfigsToCreate = yield getLaunchConfigsToCreate(
      logger, configuration, asgsToCreate, accountName
    );

    // Check launchConfigs are valid
    requiredInfra.launchConfigsToCreate.forEach((template) => {
      let minVolumeSize = template.image.rootVolumeSize;
      let osBlockDeviceMapping = _.find(template.devices, d => _.includes(['/dev/sda1', '/dev/xvda'], d.DeviceName));
      let instanceVolumeSize = osBlockDeviceMapping.Ebs.VolumeSize;

      if (instanceVolumeSize < minVolumeSize) {
        throw new DeploymentValidationError(`Cannot create Launch Configuration. The specified OS volume size (${instanceVolumeSize} GB) is not sufficient for image '${template.image.name}' (${minVolumeSize} GB). Please check your deployment map settings.`);
      }
    });

    return requiredInfra;
  }).catch((error) => {
    logger.error('An error has occurred providing the expected infrastructure', error);
    return Promise.reject(error);
  });
};

function getASGsToCreate(logger, configuration, accountName, slice) {
  return co(function* () {
    let autoScalingTemplates = yield autoScalingTemplatesProvider.get(
      configuration, accountName
    );

    let autoScalingGroupNames = autoScalingTemplates
      .map(template => template.autoScalingGroupName)
      .filter((asgName) => {
        // Only create ASGs On Demand
        return slice === 'none' ||                                        // Always create ASG in overwrite mode
            configuration.serverRole.FleetPerSlice === undefined ||       // Always create ASG if FleetPerSlice not known
            configuration.serverRole.FleetPerSlice === false ||           // Always create ASG in single ASG mode
            asgName.endsWith(`-${slice}`);                                // Create ASG if it's the target slice
      });

    let autoScalingGroupNamesToCreate = yield getASGNamesToCreate(
      logger, autoScalingGroupNames, accountName
    );

    return autoScalingTemplates.filter(template =>
      autoScalingGroupNamesToCreate.indexOf(template.autoScalingGroupName) >= 0
    );
  });
}

function getASGNamesToCreate(logger, autoScalingGroupNames, accountName) {
  return co(function* () {
    logger.info(`Following AutoScalingGroups are expected: [${autoScalingGroupNames.join(', ')}]`);
    let query = {
      name: 'ScanAutoScalingGroups',
      accountName,
      autoScalingGroupNames
    };

    let autoScalingGroups = yield sender.sendQuery({ query });
    let existingAutoScalingGroupNames = autoScalingGroups.map(group =>
      group.AutoScalingGroupName
    );
    if (existingAutoScalingGroupNames.length) {
      logger.info(`Following AutoScalingGroups already exist: [${existingAutoScalingGroupNames.join(', ')}]`);
    }

    let missingAutoScalingGroupNames = autoScalingGroupNames.filter(name =>
      existingAutoScalingGroupNames.indexOf(name) < 0
    );
    if (missingAutoScalingGroupNames.length) {
      logger.info(`Following AutoScalingGroups have to be created: [${missingAutoScalingGroupNames.join(', ')}]`);
    } else {
      logger.info('No AutoScalingGroup has to be created');
    }

    return missingAutoScalingGroupNames;
  });
}

function getLaunchConfigsToCreate(logger, configuration, autoScalingTemplates, accountName) {
  return co(function* () {
    let launchConfigurationNames = autoScalingTemplates.map(template =>
      template.launchConfigurationName
    );

    let launchConfigurationNamesToCreate = yield getLaunchConfigNamesToCreate(
      logger, launchConfigurationNames, accountName
    );
    if (!launchConfigurationNamesToCreate.length) {
      return [];
    }
    let launchConfigurationTemplates = yield launchConfigurationTemplatesProvider.get(
      configuration, accountName, logger
    );

    return launchConfigurationTemplates.filter(template =>
      launchConfigurationNamesToCreate.indexOf(template.launchConfigurationName) >= 0
    );
  });
}

function getLaunchConfigNamesToCreate(logger, launchConfigurationNames, accountName) {
  return co(function* () {
    logger.info(`Following LaunchConfigurations are expected: [${launchConfigurationNames.join(', ')}]`);
    let query = {
      name: 'ScanLaunchConfigurations',
      accountName,
      launchConfigurationNames
    };

    let launchConfigurations = yield sender.sendQuery({ query });
    let existingLaunchConfigurationNames = launchConfigurations.map(config =>
      config.LaunchConfigurationName
    );
    if (existingLaunchConfigurationNames.length) {
      logger.info(`Following LaunchConfigurations already exist: [${existingLaunchConfigurationNames.join(', ')}]`);
    }

    let missingLaunchConfigurationNames = launchConfigurationNames.filter(name =>
      existingLaunchConfigurationNames.indexOf(name) < 0
    );
    if (missingLaunchConfigurationNames.length) {
      logger.info(`Following LaunchConfigurations have to be created: [${missingLaunchConfigurationNames.join(', ')}]`);
    } else {
      logger.info('No LaunchConfiguration has to be created');
    }

    return missingLaunchConfigurationNames;
  });
}
