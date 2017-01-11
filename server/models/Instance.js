/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let co = require('co');
let taggable = require('./taggable');
let ScanCrossAccountInstances = require('queryHandlers/ScanCrossAccountInstances');
let ec2InstanceClientFactory = require('modules/clientFactories/ec2InstanceClientFactory');
let Environment = require('models/Environment');
let moment = require('moment');
let sender = require('modules/sender');
let logger = require('modules/logger');

class Instance {

  constructor(data) {
    _.assign(this, data);
  }

  getAutoScalingGroupName() {
    return this.getTag('aws:autoscaling:groupName');
  }

  persistTag(tag) {
    return ec2InstanceClientFactory.create({ accountName: this.AccountName }).then((client) => {
      let parameters = {
        instanceIds: [this.InstanceId],
        tagKey: tag.key,
        tagValue: tag.value
      };

      return client.setTag(parameters);
    });
  }

  static getById(instanceId) {
    let filter = { 'instance-id': instanceId };
    return ScanCrossAccountInstances({ filter }).then(list => new Instance(list[0]));
  }

  static getAllByEnvironment(environmentName) {
    return co(function* () {
      let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
      let startTime = moment.utc();

      let filter = {};
      filter['tag:Environment'] = environmentName;

      return sender.sendQuery({
        query: {
          name: 'ScanInstances',
          accountName,
          filter
        }
      }).then((result) => {
        let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
        logger.debug(`server-status-query: InstancesQuery took ${duration}ms`);
        return result;
      });
    });
  }
}

taggable(Instance);

module.exports = Instance;
