/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let validators = [
  require('modules/deployment/validators/blueGreenDeploymentValidator'),
  require('modules/deployment/validators/rootDeviceSizeValidator'),
  require('modules/deployment/validators/uniqueServiceVersionDeploymentValidator'),
];

module.exports = validators;
