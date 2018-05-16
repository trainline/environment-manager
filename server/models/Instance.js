/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let co = require('co');
let ec2Client = require('../modules/ec2-monitor/ec2-monitor-client');
let amazonClientFactory = require('../modules/amazon-client/childAccountClient');
let Environment = require('./Environment');
let TaggableMixin = require('./TaggableMixin');
const InstanceResourceBase = require('../modules/resourceFactories/InstanceResourceBase');

class Instance {
  constructor(data) {
    _.assign(this, data);
    this.CreationTime = this.getCreationTime();
  }

  getAutoScalingGroupName() {
    return this.getTag('aws:autoscaling:groupName');
  }

  persistTag(tag) {
    return amazonClientFactory.createEC2Client(this.AccountName)
      .then(client => new InstanceResourceBase(client))
      .then((instanceResource) => {
        let parameters = {
          instanceIds: [this.InstanceId],
          tagKey: tag.key,
          tagValue: tag.value
        };

        return instanceResource.setTag(parameters);
      });
  }

  getCreationTime() {
    return _.get(this, 'BlockDeviceMappings[0].Ebs.AttachTime');
  }

  static getById(instanceId) {
    return ec2Client.getHostByInstanceId(instanceId)
      .then(([head]) => new TaggableInstance(head));
  }

  static getAllByEnvironment(environmentName) {
    return co(function* () {
      let accountName = yield Environment.getAccountNameForEnvironment(environmentName);

      return ec2Client.getHosts(accountName, environmentName)
        .then(handleResponse);

      function handleResponse(response) {
        return response.map(i => new TaggableInstance(i));
      }
    });
  }
}

class TaggableInstance extends TaggableMixin(Instance) { }

module.exports = TaggableInstance;
