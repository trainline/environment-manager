/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let consulMacroManager = require('./consulMacroManager');
let keyValueStore = require('./keyValueStore');

module.exports = {
  getTargetState: keyValueStore.getTargetState,
  setTargetState: keyValueStore.setTargetState,
  removeTargetState: keyValueStore.removeTargetState,
  setInstanceMaintenanceMode: consulMacroManager.setInstanceMaintenanceMode,
  getAllServiceTargets: keyValueStore.getAllServiceTargets,
  getServiceDeploymentCause: keyValueStore.getServiceDeploymentCause
};
