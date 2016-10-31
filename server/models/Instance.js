/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let taggable = require('./taggable');
let ScanCrossAccountInstances = require('queryHandlers/ScanCrossAccountInstances');
let ec2InstanceClientFactory = require('modules/clientFactories/ec2InstanceClientFactory');

class Instance {

  constructor(data) {
    _.assign(this, data);
  }

  getAutoScalingGroupName() {
    return this.getTag('aws:autoscaling:groupName');
  }

  persistTag(tag) {
    return ec2InstanceClientFactory.create({ accountName: this.AccountName }).then(client => {
      let parameters = {
        instanceIds: [this.InstanceId],
        tagKey: tag.key,
        tagValue: tag.value,
      };

      return client.setTag(parameters);
    });
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