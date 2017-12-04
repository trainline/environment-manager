/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let serviceTargets = require('../../modules/service-targets');
let schema = require('../../modules/schema/schema');
let DeploymentLogsStreamer = require('../../modules/DeploymentLogsStreamer');
let deploymentLogsStreamer = new DeploymentLogsStreamer();

module.exports = function UpdateTargetState(command) {
  let { deploymentId, key, options, value } = command;
  return schema('UpdateTargetStateCommand')
    .then(x => x.assert(command))
    .then(() => deploymentLogsStreamer.log(deploymentId, `Updating key ${command.key}`))
    .then(() => serviceTargets.setTargetState(command.environment, { key, value, options }));
};
