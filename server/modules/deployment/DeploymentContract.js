/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let deploymentValidators = require('./deploymentValidators');
let _ = require('lodash');

class DeploymentContract {

  constructor(data) {
    _.assign(this, data);
  }

  validate(configuration) {
    // Checking deployment is valid through all validators otherwise return a rejected promise
    return deploymentValidators.map(validator => validator.validate(this, configuration));
  }

}


module.exports = DeploymentContract;
