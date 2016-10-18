/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let co = require('co');
let getInstanceState = require('./getInstanceState');
let getServiceTargetStates = require('./getServiceTargetStates');
let AutoScalingGroup = require('models/AutoScalingGroup');
let resourceProvider = require('modules/resourceProvider');
let logger = require('modules/logger');

function* getAWSInstances(accountName, instancesIds) {
  let resource = yield resourceProvider.getInstanceByName('instances', { accountName });

  let filter = {
    'instance-id': instancesIds,
  };

  let instances = yield resource.all({ filter });
  return _.map(instances, (instance) => {
    let ret = {
      PrivateIpAddress: instance.PrivateIpAddress,
      InstanceId: instance.InstanceId,
      InstanceType: instance.InstanceType,
      AvailabilityZone: instance.Placement.AvailabilityZone,
      State: _.capitalize(instance.State.Name),
      ImageId: instance.ImageId,
      LaunchTime: instance.LaunchTime,
    };
    instance.Tags.forEach((tag) => {
      ret[tag.Key] = tag.Value;
    });
    return ret;
  });
}

module.exports = function getASGState(accountName, environmentName, asgName) {
  return co(function* () {
    let asg = yield AutoScalingGroup.getByName(accountName, asgName);

    let instancesIds = _.map(asg.Instances, 'InstanceId');
    let instances = yield co(getAWSInstances(accountName, instancesIds));

    let instancesStates = yield _.map(instances, (instance) => {
      // Fresh instances might not have initialised tags yet - don't merge state when that happens
      if (instance.Name !== undefined) {
        return getInstanceState(accountName, environmentName, instance.Name, instance.InstanceId);
      } else {
        logger.warn(`Instance ${instance.InstanceId} name tag is undefined`);
        return {};
      }
    });

    _.forEach(instances, (instance, index) => {
      // Copy ASG instance data
      let asgInstance = _.find(asg.Instances, { InstanceId: instance.InstanceId });
      instance.LifecycleState = asgInstance.LifecycleState;

      // Copy ASG state data
      _.assign(instance, instancesStates[index]);
    });

    let response = {
      Instances: instances,
      Services: yield getServiceTargetStates(environmentName, asg.getRuntimeServerRoleName(), instances),
    };
    return response;
  });
};
