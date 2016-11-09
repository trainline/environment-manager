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
  let size = command.parameters.size;

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

  // Get a resource instance to work with AutoScalingGroup in the proper
  // AWS account.
  let accountName = yield Environment.getAccountNameForEnvironment(command.environmentName);
  let resource = yield resourceProvider.getInstanceByName('asgs', { accountName });

  let subnets;
  
  let network = command.parameters.network;
  if (!_.isNil(network)) {

    let environment = yield Environment.getByName(command.environmentName);
    let environmentType = yield EnvironmentType.getByName(environment.EnvironmentType);
    let asg = yield resource.get({ name: command.autoScalingGroupName });

    let currentSubnet = asg.VPCZoneIdentifier.split(',')[0];
    let currentSubnetType = getSubnetTypeBySubnet(environmentType.Subnets, currentSubnet);

    subnets = yield subnetsProvider.get({
      serverRole: {
        SecurityZone: asg.getTag('SecurityZone'),
        SubnetTypeName: currentSubnetType.name,
        AvailabilityZoneName: network.availabilityZoneName
      },
      environmentType: environmentType,
      environmentTypeName: environment.EnvironmentType
    });

  }

  let parameters = {
    name: command.autoScalingGroupName,
    minSize: size.min,
    desiredSize: size.desired,
    maxSize: size.max,
    subnets: subnets
  };

  return resource.put(parameters);
}

function getSubnetTypeBySubnet(subnetTypes, subnet) {
  let subnetTypeArray = _.keys(subnetTypes).map(key => {
    let subnetType = unMapSubnetType(key, subnetTypes[key]);
    return subnetType;
  });
  return _.find(subnetTypeArray, subnetType => subnetType.hasSubnet(subnet));
}

function unMapSubnetType(subnetTypeName, subnetType) {
  let azs = _.keys(subnetType)
    .filter(key => key.startsWith('AvailabilityZone'))
    .map(key => {
      return {
        name: key,
        subnet: subnetType[key]
      }
    });

  return {
    name: subnetTypeName,
    availabilityZones: azs,
    secure: !!subnetType.Secure,
    hasSubnet: subnet => {
      return !!_.some(azs, az => az.subnet === subnet);
    }
  };
}

module.exports = co.wrap(handler);