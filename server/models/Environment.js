/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let environmentDatabase = require('modules/environmentDatabase');
let DeploymentMap = require('./DeploymentMap');
let EnvironmentType = require('./EnvironmentType');

class Environment {
  
  constructor(data) {
    _.assign(this, data);
  }

  getEnvironmentType() {
    return EnvironmentType.getByName(this.EnvironmentType);
  }

  getDeploymentMap() {
    return DeploymentMap.getByName(this.DeploymentMap);
  }

  static getByName(name) {
    return environmentDatabase.getEnvironmentByName(name).then((obj) => new Environment(obj));
  }
}

module.exports = Environment;