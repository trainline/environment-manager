/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let consulMacro = require('./consulMacroManager');
let consulKVstore = require('./keyValueStore');

module.exports = {
  getTargetState: consulKVstore.getTargetState,
  setTargetState: consulKVstore.setTargetState,
  removeTargetState: consulKVstore.removeTargetState,
  setInstanceMaintenanceMode: consulMacro.setInstanceMaintenanceMode,
  getAllServiceTargets: consulKVstore.getAllServiceTargets,
  getServiceDeploymentCause: consulKVstore.getServiceDeploymentCause
};
