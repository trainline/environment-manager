'use strict';

let assert = require('assert');
let co = require('co');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let resourceProvider = require('modules/resourceProvider');
let _ = require('lodash');

module.exports = function CreateLaunchConfigurationCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  assert(command, 'Expected "command" argument not to be null.');
  assert(command.template, 'Expected "command" argument to contain "template" property not null.');
  assert(command.accountName, 'Expected "command" argument to contain "accountName" property not null or empty.');

  return co(function* () {
    let template = command.template;
    let accountName = command.accountName;
    let launchConfigurationName = template.launchConfigurationName;

    logger.info(`Creating [${launchConfigurationName}] LaunchConfiguration...`);

    let launchConfigurationClient = yield resourceProvider.getInstanceByName('launchconfig', { accountName });

    let request = getCreateLaunchConfigurationRequest(template);
    yield launchConfigurationClient.post(request);

    logger.info(`LaunchConfiguration [${launchConfigurationName}] has been created`);
  });
};

function getCreateLaunchConfigurationRequest(template) {
  return {
    LaunchConfigurationName: template.launchConfigurationName,
    AssociatePublicIpAddress: false,
    ImageId: template.image.id,
    InstanceType: template.instanceType,
    KeyName: template.keyName,
    InstanceMonitoring: {
      Enabled: template.detailedMonitoring,
    },
    IamInstanceProfile: template.iamInstanceProfile,
    SecurityGroups: _.map(template.securityGroups, 'GroupId'),
    UserData: template.userData,
    BlockDeviceMappings: template.devices,
  };
}
