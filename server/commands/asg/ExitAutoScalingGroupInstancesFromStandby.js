/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let resourceProvider = require('modules/resourceProvider');
let co = require('co');
let sender = require('modules/sender');
let autoScalingGroupSizePredictor = require('modules/autoScalingGroupSizePredictor');
let logger = require('modules/logger');
let AutoScalingGroup = require('models/AutoScalingGroup');

module.exports = function ExitAutoScalingGroupInstancesFromStandby(command) {
  assert(command.accountName !== undefined && command.accountName !== null);
  assert(command.autoScalingGroupName !== undefined && command.autoScalingGroupName !== null);
  assert(command.instanceIds !== undefined && command.instanceIds !== null);

  return co(function* () {
    let parameters;
    let childCommand;

    let autoScalingGroup = yield AutoScalingGroup.getByName(command.accountName, command.autoScalingGroupName);

    // Predict AutoScalingGroup size after exiting instances from standby
    let expectedSize = yield autoScalingGroupSizePredictor.predictSizeAfterExitingInstancesFromStandby(autoScalingGroup, command.instanceIds);

    // Create a resource to work with AutoScalingGroups in the target AWS account.
    parameters = { accountName: command.accountName };
    let asgResource = yield resourceProvider.getInstanceByName('asgs', parameters);

    // Before exiting instances from Standby the AutoScalingGroup maximum size has to be
    // increased because the action of "exiting instances from standby" will automatically
    // increase the desired capacity and this cannot be greater than the maximum size.
    childCommand = {
      name: 'SetAutoScalingGroupSize',
      accountName: command.accountName,
      autoScalingGroupName: command.autoScalingGroupName,
      autoScalingGroupMaxSize: expectedSize,
    };
    yield sender.sendCommand({ command: childCommand, parent: command });

    // Through the resource instance previously created the AutoScalingGroup instances
    // are exited from standby
    parameters = {
      name: command.autoScalingGroupName,
      instanceIds: command.instanceIds,
    };
    yield asgResource.exitInstancesFromStandby(parameters);

    // After exiting instances from Standby the AutoScalingGroup minimum size should be
    // increased as well as the maximum size. This because the AutoScalingGroup minimum,
    // maximum and desired size are equal by convention.
    childCommand = {
      name: 'SetAutoScalingGroupSize',
      accountName: command.accountName,
      autoScalingGroupName: command.autoScalingGroupName,
      autoScalingGroupMinSize: expectedSize,
    };
    yield sender.sendCommand({ command: childCommand, parent: command });

    return { InstancesExitedFromStandby: command.instanceIds };
  });
};
