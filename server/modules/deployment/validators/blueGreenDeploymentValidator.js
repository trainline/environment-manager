/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let Enums = require('Enums');
let DeploymentValidationError = require('modules/errors/DeploymentValidationError.class');
const SupportedSliceNames = _.values(Enums.SliceName);

module.exports = {
  validate(deployment, configuration) {
    if (configuration.serverRole.FleetPerSlice !== true) return Promise.resolve();
    if (SupportedSliceNames.indexOf(deployment.serviceSlice) >= 0) return Promise.resolve();

    return Promise.reject(new DeploymentValidationError(
      `${'Server role configuration expects two AutoScalingGroups ' +
      `for '${deployment.serviceName}' blue/green slices ` +
      'but current deployment slice is '}${
      deployment.serviceSlice ? `'${deployment.serviceSlice}'.` : 'empty.'}`
    ));
  },
};
