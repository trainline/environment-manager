/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let _ = require('lodash');
const asgResourceFactory = require('../../modules/resourceFactories/asgResourceFactory');
let InvalidOperationError = require('../../modules/errors/InvalidOperationError.class');

function* handler(command) {
  // Validation
  let min = command.autoScalingGroupMinSize;
  let desired = command.autoScalingGroupDesiredSize;
  let max = command.autoScalingGroupMaxSize;

  if (!_.isNil(min)) {
    if (!_.isNil(max) && min > max) {
      throw new InvalidOperationError(
        `Provided Max size '${max}' must be greater than or equal to the Min size '${min}'.`
      );
    }

    if (!_.isNil(desired) && desired < min) {
      throw new InvalidOperationError(
        `Provided Desired size '${desired}' must be greater than or equal to the Min size '${min}'.`
      );
    }
  }

  if (!_.isNil(max)) {
    if (!_.isNil(min) && min > max) {
      throw new InvalidOperationError(
        `Provided Min size '${min}' must be less than or equal to the Max size '${max}'.`
      );
    }

    if (!_.isNil(desired) && desired > max) {
      throw new InvalidOperationError(
        `Provided Desired size '${desired}' must be less than or equal to the Max size '${max}'.`
      );
    }
  }

  // Get a resource instance to work with AutoScalingGroup in the proper
  // AWS account.
  let parameters = { accountName: command.accountName };
  let resource = yield asgResourceFactory(undefined, parameters);

  // Change the AutoScalingGroup size accordingly to the expected one.
  parameters = {
    name: command.autoScalingGroupName,
    minSize: command.autoScalingGroupMinSize,
    desiredSize: command.autoScalingGroupDesiredSize,
    maxSize: command.autoScalingGroupMaxSize
  };

  return resource.put(parameters);
}

module.exports = co.wrap(handler);
