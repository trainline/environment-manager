/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let co = require('co');
let amazonClientFactory = require('../modules/amazon-client/childAccountClient');
let Environment = require('./Environment');
let moment = require('moment');
let logger = require('../modules/logger');
let TaggableMixin = require('./TaggableMixin');
const InstanceResourceBase = require('../modules/resourceFactories/InstanceResourceBase');
let scanCrossAccountFn = require('../modules/queryHandlersUtil/scanCrossAccountFn');

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
    function findInstanceInAccount({ AccountNumber }) {
      return amazonClientFactory.createEC2Client(AccountNumber)
      .then(client => new InstanceResourceBase(client))
      .then(instanceResource => instanceResource.all({ filter: { 'instance-id': instanceId } }))
      .then(instances => instances.map(instance => new TaggableInstance(instance)));
    }
    return scanCrossAccountFn(findInstanceInAccount).then(([head]) => head);
  }

  static getAllByEnvironment(environmentName) {
    return co(function* () {
      let accountName = yield Environment.getAccountNameForEnvironment(environmentName);
      let startTime = moment.utc();
      return amazonClientFactory.createEC2Client(accountName)
        .then(client => new InstanceResourceBase(client))
        .then(instanceResource => instanceResource.all({ filter: { 'tag:Environment': environmentName } }))
        .then(instances => instances.map(instance => new TaggableInstance(instance)))
        .then((result) => {
          let duration = moment.duration(moment.utc().diff(startTime)).asMilliseconds();
          logger.debug(`server-status-query: InstancesQuery took ${duration}ms`);
          return result;
        });
    });
  }
}

class TaggableInstance extends TaggableMixin(Instance) { }

module.exports = TaggableInstance;
