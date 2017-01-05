/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let co = require('co');
let resourceProvider = require('modules/resourceProvider');

function* getAWSInstances(accountName, instancesIds) {
  let resource = yield resourceProvider.getInstanceByName('instances', { accountName });

  let filter = {
    'instance-id': instancesIds
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
    instance.Tags.forEach(function (tag) {
      ret[tag.Key] = tag.Value;
    });
    return ret;
  });
}

module.exports = co.wrap(getAWSInstances);