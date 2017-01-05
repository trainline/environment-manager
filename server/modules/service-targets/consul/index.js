/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let {
  setInstanceMaintenanceMode
} = require('./consulMacroManager');

let {
  getTargetState,
  setTargetState,
  removeTargetState,
  removeRuntimeServerRoleTargetState,
  getAllServiceTargets,
  getServiceDeploymentCause,
  getInstanceServiceDeploymentInfo
} = require('./keyValueStore');

module.exports = {
  getTargetState,
  setTargetState,
  removeTargetState,
  removeRuntimeServerRoleTargetState,
  setInstanceMaintenanceMode,
  getAllServiceTargets,
  getServiceDeploymentCause,
  getInstanceServiceDeploymentInfo
};
