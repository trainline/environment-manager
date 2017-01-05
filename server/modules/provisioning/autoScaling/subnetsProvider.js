/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let co = require('co');
let ConfigurationError = require('modules/errors/ConfigurationError.class');
let _ = require('lodash');

const SECURE_SECURITY_ZONE = 'Secure';

module.exports = {
  get: function (configuration) {
    assert(configuration, 'Expected "configuration" argument not to be null.');

    return co(function* () {
      let subnetTypeName = configuration.serverRole.SubnetTypeName;
      validateSubnetType(configuration);
      let subnets = yield getSubnetsByAvailabilityZone(subnetTypeName, configuration);
      return subnets;
    }).catch(error => {
      throw new ConfigurationError(
            `Error retrieving subnet from "${configuration.environmentTypeName}": ${error.message}`);
    });
  },
};

function validateSubnetType(configuration) {

  let securityZone = configuration.serverRole.SecurityZone;
  let subnetTypeName = configuration.serverRole.SubnetTypeName;

  let subnetType = configuration.environmentType.Subnets[subnetTypeName];

  if (subnetType === undefined) {
    throw new Error(`Couldn't find Subnet Type ${subnetTypeName} in environment type config`);
  }

  if (securityZone === SECURE_SECURITY_ZONE && subnetType.Secure !== true) {
    throw new Error(`Can't use insecure subnet type "${subnetTypeName}" to deploy to Server Role with Security Zone "Secure"`);
  }
}

function getSubnetsByAvailabilityZone(subnetTypeName, configuration) {

  var subnetType = configuration.environmentType.Subnets[subnetTypeName];
  if (!subnetType) {
    throw new Error(`"${subnetTypeName}" subnet type not found`);
  }

  var availabilityZoneName = (configuration.serverRole.AvailabilityZoneName || '*');
  var subnets = [];

  if (availabilityZoneName === '*') {
    subnets = [subnetType.AvailabilityZoneA, subnetType.AvailabilityZoneB, subnetType.AvailabilityZoneC,
               subnetType.AvailabilityZoneD, subnetType.AvailabilityZoneE, subnetType.AvailabilityZoneF];
  } else {
    let azs = _.toArray(availabilityZoneName);
    azs.forEach(az => {
      let name = az.toUpperCase();
      switch (name) {
        case 'A':
          subnets.push(subnetType.AvailabilityZoneA);
          break;
        case 'B':
          subnets.push(subnetType.AvailabilityZoneB);
          break;
        case 'C':
          subnets.push(subnetType.AvailabilityZoneC);
          break;
        case 'D':
          subnets.push(subnetType.AvailabilityZoneD);
          break;
        case 'E':
          subnets.push(subnetType.AvailabilityZoneE);
          break;
        case 'F':
          subnets.push(subnetType.AvailabilityZoneF);
          break;
        default:
          throw new Error(`Unknown "${name}" availability zone specified in configuration. ` +
            `Please specify one of the following values: "A", "B", "C" or "*".`);
      }
    });
  }

  subnets = _.compact(subnets);

  if (subnets.some(subnet => !subnet.trim())) {
    throw new Error(`"${subnetTypeName}" subnet type does not contain the expected availability zones.`);
  }

  return subnets;
}
