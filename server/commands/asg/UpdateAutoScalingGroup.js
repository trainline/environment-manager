/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict'

let co = require('co');
let _ = require('lodash');
let OperationResult = require('../utils/operationResult');
let resourceProvider = require('modules/resourceProvider');
let InvalidOperationError = require('modules/errors/InvalidOperationError.class');
let subnetsProvider = require('modules/provisioning/autoScaling/subnetsProvider');
let sender = new require('modules/sender');
let Environment = require('models/Environment');
let EnvironmentType = require('models/EnvironmentType');

function* handler(command) {
  const result = new OperationResult();

  // Validation
  let size = command.size;

  if (!_.isNil(size.min)) {
    if (!_.isNil(size.max) && size.min > size.max) {
      throw new InvalidOperationError(
        `Provided Max size '${size.max}' must be greater than or equal to the Min size '${size.min}'.`
      );
    }

    if (!_.isNil(size.desired) && size.desired < size.min) {
      throw new InvalidOperationError(
        `Provided Desired size '${size.desired}' must be greater than or equal to the Min size '${size.min}'.`
      );
    }
  }

  if (!_.isNil(size.max)) {
    if (!_.isNil(size.min) && size.min > size.max) {
      throw new InvalidOperationError(
        `Provided Min size '${size.min}' must be less than or equal to the Max size '${size.max}'.`
      );
    }

    if (!_.isNil(size.desired) && size.desired > size.max) {
      throw new InvalidOperationError(
        `Provided Desired size '${size.desired}' must be less than or equal to the Max size '${size.max}'.`
      );
    }
  }

  let az = command.az;

  let subnets;
  if (!_.isNil(az)) {
    let environment = yield Environment.getByName(command.environmentName);
    let environmentType = yield EnvironmentType.getByName(environment.EnvironmentType);

    let configuration = {
      serverRole: {
        SubnetTypeName: az.subnetTypeName,
        SecurityZone: az.securityZone,
        AvailabilityZoneName: az.availabilityZoneName
      },
      environmentType: environmentType,
      environmentTypeName: environment.EnvironmentType
    };

    subnets = yield subnetsProvider.get(configuration);
  }

  // Get a resource instance to work with AutoScalingGroup in the proper
  // AWS account.
  let accountName = yield Environment.getAccountNameForEnvironment(command.environmentName);
  let resource = yield resourceProvider.getInstanceByName('asgs', { accountName });

  let parameters = {
    name: command.autoScalingGroupName,
    minSize: size.min,
    desiredSize: size.desired,
    maxSize: size.max,
    subnets: subnets
  };

  return resource.put(parameters);
}

module.exports = co.wrap(handler);