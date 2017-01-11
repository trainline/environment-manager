/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let DeploymentValidationError = require('modules/errors/DeploymentValidationError.class');

module.exports = {
  validate(deployment, configuration) {
    let requiredSize = configuration.image.rootVolumeSize;
    let rootDevice = configuration.serverRole.Volumes.find(v => v.Name === 'OS');
    let serverRole = configuration.serverRole.ServerRoleName;

    if (!rootDevice) {
      return error(`Server role "${serverRole}" has no OS volume.`);
    }

    let size = rootDevice.Size;
    if (rootDevice.Size < requiredSize) {
      let ami = configuration.image.name;
      return error(`Server role "${serverRole}" has an OS volume of ${size} GB but uses AMI "${ami}" which requires at least ${requiredSize} GB.`);
    }

    return success();
  },
};

function error(message) {
  return Promise.reject(new DeploymentValidationError(message));
}

function success() {
  return Promise.resolve();
}
