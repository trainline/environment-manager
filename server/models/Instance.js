/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let taggable = require('./taggable');
let ScanCrossAccountInstances = require('queryHandlers/ScanCrossAccountInstances');

class Instance {

  constructor(data) {
    _.assign(this, data);

  }

  getAutoScalingGroupName() {
    return this.getTag('aws:autoscaling:groupName');
  }

  static getById(instanceId) {
    let filter = { 'instance-id': instanceId };
    return ScanCrossAccountInstances({ filter }).then(list => {
      return new Instance(list[0]);
    });
  }

}

taggable(Instance);

module.exports = Instance;