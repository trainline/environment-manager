/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');

function getAutoScalingGroupName(configuration, sliceName) {
  assert(configuration, 'Expected \'configuration\' argument not to be null.');

  let segments = [
    configuration.environmentName,
    configuration.cluster.ShortName.toLowerCase(),
    getRoleName(configuration, sliceName)
  ];
  let autoScalingGroupName = segments.join('-');
  return autoScalingGroupName;
}

function getLaunchConfigurationName(configuration, sliceName) {
  assert(configuration, 'Expected \'configuration\' argument not to be null.');

  let autoScalingGroupName = getAutoScalingGroupName(configuration, sliceName);
  let launchConfigurationName = `LaunchConfig_${autoScalingGroupName}`;
  return launchConfigurationName;
}

/**
 * Note: by "serverRole" / "serverRoleName", we could mean:
 * 1. Deployment target, ie. server role name as in configuration, like "MultitenantOverwrite"
 * 2. Runtime server role, with slice, like "MultitenantOverwrite-blue"
 *
 */
function getRoleName(configuration, sliceName) {
  assert(configuration, 'Expected \'configuration\' argument not to be null.');

  let roleName = isAutoScalingGroupPerSlice(configuration)
    ? `${configuration.serverRole.ServerRoleName}-${sliceName}`
    : configuration.serverRole.ServerRoleName;
  return roleName;
}

function isAutoScalingGroupPerSlice(configuration) {
  return configuration.serverRole.FleetPerSlice === true;
}

module.exports = {
  getAutoScalingGroupName,
  getLaunchConfigurationName,
  getRoleName
};
