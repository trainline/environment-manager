/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assertContract = require('modules/assertContract');
let launchConfigUpdater = require('./launchConfigUpdater');
let co = require('co');
let sender = require('modules/sender');
let logger = require('modules/logger');
let _ = require('lodash');

let imageProvider = require('modules/provisioning/launchConfiguration/imageProvider');
let instanceDevicesProvider = require('modules/provisioning/launchConfiguration/instanceDevicesProvider');
let securityGroupsProvider = require('modules/provisioning/launchConfiguration/securityGroupsProvider');

let SecurityGroup = require('models/SecurityGroup');
let AutoScalingGroup = require('models/AutoScalingGroup');

module.exports = function SetLaunchConfiguration(command) {
  return co(function* () {
    assertContract(command, 'command', {
      properties: {
        accountName: { type: String, empty: false },
        autoScalingGroupName: { type: String, empty: false },
        data: {
          properties: {
            AMI: { type: String, empty: true },
            InstanceType: { type: String, empty: true },
            InstanceProfileName: { type: String, empty: true},
            Volumes: { type: Array, empty: true },
            // KeyName: { type: String, empty: true },
            SecurityGroups: { type: Array, empty: true },
          }
        }
      },
    });

    let data = command.data;
    let updated = {};

    let autoScalingGroup = yield AutoScalingGroup.getByName(command.accountName, command.autoScalingGroupName);
    let environmentType = yield autoScalingGroup.getEnvironmentType();
    let vpcId = environmentType.VpcId;

    if (data.InstanceProfileName !== undefined) {
      // That's checking if this instance profile name exists
      yield getInstanceProfileByName(command.accountName, data.InstanceProfileName);
      updated.IamInstanceProfile = data.InstanceProfileName;
    }

    if (data.InstanceType !== undefined) {
      updated.InstanceType = data.InstanceType;
    }

    if (data.Volumes !== undefined) {
      updated.BlockDeviceMappings = instanceDevicesProvider.toAWS(data.Volumes);
    }

    if (data.SecurityGroups !== undefined) {
      let securityGroupsNamesAndReasons = _.map(data.SecurityGroups, (name) => {
        return {
          name,
          reason: 'It was set by user in LaunchConfig form'
        };
      });
      let securityGroups = yield securityGroupsProvider.getFromSecurityGroupNames(command.accountName, vpcId, securityGroupsNamesAndReasons, logger);
      updated.SecurityGroups = _.map(securityGroups, 'GroupId');
    }

    if (data.AMI !== undefined) {
      let image = yield imageProvider.get(data.AMI);
      updated.ImageId = image.id
    }

    if (data.UserData !== undefined) {
      updated.UserData = new Buffer(data.UserData).toString('base64');
    }

    var accountName = command.accountName;
    var autoScalingGroupName = command.autoScalingGroupName;

    logger.debug(`Updating ASG ${autoScalingGroupName} with: ${JSON.stringify(updated)}`);

    return launchConfigUpdater.set(
      accountName,
      autoScalingGroup,
      (launchConfiguration) => {
        _.assign(launchConfiguration, updated);
      }
    );
  });
};


function getInstanceProfileByName(accountName, instanceProfileName) {
  var query = {
    name: 'GetInstanceProfile',
    accountName: accountName,
    instanceProfileName: instanceProfileName,
  };

  return sender.sendQuery({ query });
}
