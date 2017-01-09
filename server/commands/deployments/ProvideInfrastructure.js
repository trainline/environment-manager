/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';


let co = require('co');
let assertContract = require('modules/assertContract');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let DeploymentContract = require('modules/deployment/DeploymentContract');
let launchConfigurationTemplatesProvider = require('modules/provisioning/launchConfigurationTemplatesProvider');
let infrastructureConfigurationProvider = require('modules/provisioning/infrastructureConfigurationProvider');
let autoScalingTemplatesProvider = require('modules/provisioning/autoScalingTemplatesProvider');
let sender = require('modules/sender');
let _ = require('lodash');

module.exports = function ProvideInfrastructureCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  assertContract(command, 'command', {
    properties: {
      deployment: { type: DeploymentContract, null: false },
    },
  });

  return co(function* () {
    let deployment = command.deployment;
    let environmentName = deployment.environmentName;
    let serviceName = deployment.serviceName;
    let accountName = deployment.accountName;

    logger.info('Reading infrastructure configuration...');

    let configuration = yield infrastructureConfigurationProvider.get(
      environmentName, serviceName, deployment.serverRoleName
    );

    let autoScalingTemplatesToCreate = yield getAutoScalingTemplatesToCreate(
      logger, configuration, accountName
    );

    if (!autoScalingTemplatesToCreate.length) return;

    let launchConfigurationTemplatesToCreate = yield getLaunchConfigurationTemplatesToCreate(
      logger, configuration, autoScalingTemplatesToCreate, accountName
    );

    yield launchConfigurationTemplatesToCreate.map(
      template => provideLaunchConfiguration(template, accountName, command)
    );

    _.each(launchConfigurationTemplatesToCreate, (template) => {
      let securityGroupsNames = _.map(template.securityGroups, sg => sg.getName());
      logger.info(`LaunchConfiguration ${template.launchConfigurationName} Security Groups: ${securityGroupsNames.join(', ')}`);
    });

    yield autoScalingTemplatesToCreate.map(
      template => provideAutoScalingGroup(template, accountName, command)
    );
  }).catch((error) => {
    logger.error('An error has occurred providing the expected infrastructure', error);
    return Promise.reject(error);
  });
};

function getAutoScalingTemplatesToCreate(logger, configuration, accountName) {
  return co(function* () {
    let autoScalingTemplates = yield autoScalingTemplatesProvider.get(
      configuration, accountName
    );
    let autoScalingGroupNames = autoScalingTemplates.map(template =>
      template.autoScalingGroupName
    );
    let autoScalingGroupNamesToCreate = yield getAutoScalingGroupNamesToCreate(
      logger, autoScalingGroupNames, accountName
    );
    let autoScalingTemplatesToCreate = autoScalingTemplates.filter(template =>
      autoScalingGroupNamesToCreate.indexOf(template.autoScalingGroupName) >= 0
    );

    return autoScalingTemplatesToCreate;
  });
}

function getAutoScalingGroupNamesToCreate(logger, autoScalingGroupNames, accountName) {
  return co(function* () {
    logger.info(`Following AutoScalingGroups are expected: [${autoScalingGroupNames.join(', ')}]`);

    let query = {
      name: 'ScanAutoScalingGroups',
      accountName,
      autoScalingGroupNames,
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

function getLaunchConfigurationTemplatesToCreate(logger, configuration, autoScalingTemplates, accountName) {
  return co(function* () {
    let launchConfigurationNames = autoScalingTemplates.map(template =>
      template.launchConfigurationName
    );

    let launchConfigurationNamesToCreate = yield getLaunchConfigurationNamesToCreate(
      logger, launchConfigurationNames, accountName
    );

    if (!launchConfigurationNamesToCreate.length) {
      return [];
    }

    let launchConfigurationTemplates = yield launchConfigurationTemplatesProvider.get(
      configuration, accountName, logger
    );

    let launchConfigurationTemplatesToCreate = launchConfigurationTemplates.filter(template =>
      launchConfigurationNamesToCreate.indexOf(template.launchConfigurationName) >= 0
    );

    return launchConfigurationTemplatesToCreate;
  });
}

function getLaunchConfigurationNamesToCreate(logger, launchConfigurationNames, accountName) {
  return co(function* () {
    logger.info(`Following LaunchConfigurations are expected: [${launchConfigurationNames.join(', ')}]`);

    let query = {
      name: 'ScanLaunchConfigurations',
      accountName,
      launchConfigurationNames,
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

function provideLaunchConfiguration(launchConfigurationTemplate, accountName, parentCommand) {
  let command = {
    name: 'CreateLaunchConfiguration',
    accountName,
    template: launchConfigurationTemplate,
  };

  return sender.sendCommand({ command, parent: parentCommand }).catch(error => (
      error.name === 'LaunchConfigurationAlreadyExistsError' ?
        Promise.resolve() :
        Promise.reject(error)
  ));
}

function provideAutoScalingGroup(autoScalingTemplate, accountName, parentCommand) {
  let command = {
    name: 'CreateAutoScalingGroup',
    accountName,
    template: autoScalingTemplate,
  };

  return sender.sendCommand({ command, parent: parentCommand }).catch(error => (
      error.name === 'AutoScalingGroupAlreadyExistsError' ?
        Promise.resolve() :
        Promise.reject(error)
  ));
}
