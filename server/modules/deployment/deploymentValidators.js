/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const blueGreenDeploymentValidator = require('./validators/blueGreenDeploymentValidator');
const uniqueServiceVersionDeploymentValidator = require('./validators/uniqueServiceVersionDeploymentValidator');

let validators = [
  blueGreenDeploymentValidator,
  uniqueServiceVersionDeploymentValidator
];

module.exports = validators;
