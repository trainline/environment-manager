/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let co = require('co');
let sender = require('../../modules/sender');
let autoScalingGroupSizePredictor = require('../../modules/autoScalingGroupSizePredictor');
let AutoScalingGroup = require('../../models/AutoScalingGroup');
let SetAutoScalingGroupSize = require('./SetAutoScalingGroupSize');
const asgResourceFactory = require('../../modules/resourceFactories/asgResourceFactory');

module.exports = function EnterAutoScalingGroupInstancesToStandbyCommandHandler(command) {
  assert(command, 'Expected "command" argument not to be null.');
  assert(command.accountName, 'Expected "command" argument to contain "accountName" property not null or empty.');
  assert(command.autoScalingGroupName, 'Expected "command" argument to contain "autoScalingGroupName" property not null or empty.');
  assert(command.instanceIds, 'Expected "command" argument to contain "instanceIds" property not null or empty.');

  return co(function* () {
    // Send a query to obtain the AutoScalingGroup information.
    let autoScalingGroup = yield AutoScalingGroup.getByName(command.accountName, command.autoScalingGroupName);

    // Create a resource to work with AutoScalingGroups in the target AWS account.
    let parameters = { accountName: command.accountName };
    let asgResource = yield asgResourceFactory.create(undefined, parameters);

    // Predict AutoScalingGroup size after entering instances to standby
    let expectedSize = yield autoScalingGroupSizePredictor.predictSizeAfterEnteringInstancesToStandby(
      autoScalingGroup,
      command.instanceIds);

    // Before entering instances to Standby the AutoScalingGroup minimum size has to be
    // reduced because the action of "entering instances to standby" will automatically
    // reduce the desired capacity and this cannot be less than the minimum size.
    yield setAutoScalingGroupSize({ min: expectedSize }, command);

    // Through the resource instance previously created the AutoScalingGroup instances
    // are entered to standby
    yield asgResource.enterInstancesToStandby({ name: command.autoScalingGroupName, instanceIds: command.instanceIds });

    // After entering instances to Standby the AutoScalingGroup maximum size should be
    // reduced as well as the minimum size. This because the AutoScalingGroup minimum,
    // maximum and desired size are equal by convention.
    yield setAutoScalingGroupSize({ max: expectedSize }, command);

    return {
      InstancesEnteredToStandby: command.instanceIds
    };
  });
};

function setAutoScalingGroupSize(size, parentCommand) {
  let command = {
    name: 'SetAutoScalingGroupSize',
    accountName: parentCommand.accountName,
    autoScalingGroupName: parentCommand.autoScalingGroupName,
    autoScalingGroupMinSize: size.min,
    autoScalingGroupMaxSize: size.max
  };

  return sender.sendCommand(SetAutoScalingGroupSize, { command, parent: parentCommand });
}
