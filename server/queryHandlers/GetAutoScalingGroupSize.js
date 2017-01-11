/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let getASG = require('modules/queryHandlersUtil/getASG');
let assert = require('assert');

function convertToGroupSize(autoScalingGroup) {
  let result = {
    min: autoScalingGroup.MinSize,
    max: autoScalingGroup.MaxSize,
    desired: autoScalingGroup.DesiredCapacity,
    current: autoScalingGroup.Instances.filter(isInstanceHealthy).length,
  };

  return result;
}

function isInstanceHealthy(instance) {
  return instance.LifecycleState === 'InService' &&
    instance.HealthStatus === 'Healthy';
}

module.exports = function GetAutoScalingGroupSize(query) {
  assert(query.accountName);
  assert(query.autoScalingGroupName);

  return getASG(query).then(convertToGroupSize);
};
