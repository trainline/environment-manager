/* Copyright (c) Trainline Limited. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let DeploymentCommandHandlerLogger = require('./DeploymentCommandHandlerLogger');
let sender = require('../../modules/sender');
let _ = require('lodash');

module.exports = function ProvideInfrastructure(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  return co(function* () {
    let accountName = command.accountName;
    let asgsToCreate = command.asgsToCreate;
    let launchConfigsToCreate = command.launchConfigsToCreate;

    logger.info('Creating required infrastructure...');
    logger.info(`${launchConfigsToCreate.length} launch configs to create`);

    yield launchConfigsToCreate.map(
      template => provideLaunchConfiguration(template, accountName, command)
    );

    _.each(launchConfigsToCreate, (template) => {
      let securityGroupsNames = _.map(template.securityGroups, sg => sg.getName());
      logger.info(`LaunchConfiguration ${template.launchConfigurationName} Security Groups: ${securityGroupsNames.join(', ')}`);
    });

    logger.info(`${asgsToCreate.length} ASGs to create`);
    yield asgsToCreate.map(
      template => provideAutoScalingGroup(template, accountName, command)
    );
  }).catch((error) => {
    logger.error('An error has occurred providing the expected infrastructure', error);
    return Promise.reject(error);
  });
};

function provideLaunchConfiguration(launchConfigurationTemplate, accountName, parentCommand) {
  let command = {
    name: 'CreateLaunchConfiguration',
    accountName,
    template: launchConfigurationTemplate
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
    template: autoScalingTemplate
  };

  return sender.sendCommand({ command, parent: parentCommand }).catch(error => (
      error.name === 'AutoScalingGroupAlreadyExistsError' ?
        Promise.resolve() :
        Promise.reject(error)
  ));
}
