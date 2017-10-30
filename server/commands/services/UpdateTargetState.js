/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let serviceTargets = require('../../modules/service-targets');
let schema = require('../../modules/schema/schema');
let DeploymentLogsStreamer = require('../../modules/DeploymentLogsStreamer');
let deploymentLogsStreamer = new DeploymentLogsStreamer();

module.exports = function UpdateTargetState(command) {
  return co(function* () {
    let { deploymentId, key, options, value } = command;
    yield schema('UpdateTargetStateCommand').then(x => x.conform(command));
    deploymentLogsStreamer.log(deploymentId, `Updating key ${command.key}`);
    return yield serviceTargets.setTargetState(command.environment, { key, value, options });
  });
};
