/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let deployments = require('modules/data-access/deployments');

class Deployment {

  constructor(data, expectedNodes = undefined) {
    _.assign(this, data);
    if (expectedNodes !== undefined) {
      _.assign(this, { ExpectedNodes: expectedNodes });
    }
  }

  static getById(key) {
    return deployments.get({ DeploymentID: key });
  }
}

module.exports = Deployment;
