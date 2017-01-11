/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let InvalidOperationError = require('modules/errors/InvalidOperationError.class');
const STATES_AS_IN_SERVICE = ['InService', 'Pending', 'Pending:Wait', 'Pending:Proceed'];

function getFirstUnknownInstanceId(autoScalingGroup, instanceIds) {
  let autoScalingGroupInstanceIds = autoScalingGroup.Instances.map(
    instance => instance.InstanceId
  );

  let unknownInstanceIds = instanceIds.filter(id =>
      autoScalingGroupInstanceIds.indexOf(id) < 0
  );
  return unknownInstanceIds[0];
}

function predictSizeAfterEnteringInstancesToStandby(autoScalingGroup, instancesIds) {
  let unknownInstanceId = getFirstUnknownInstanceId(autoScalingGroup, instancesIds);
  if (unknownInstanceId) {
    return Promise.reject(new InvalidOperationError(
      `The instance "${unknownInstanceId}" is not part of "${autoScalingGroup.AutoScalingGroupName}" AutoScalingGroup.`
    ));
  }

  let instancesInService = 0;
  let instancesToStandby = 0;

  for (let i = 0; i < autoScalingGroup.Instances.length; i++) {
    let instance = autoScalingGroup.Instances[i];

    // Counting all instances that are or will be InService
    if (STATES_AS_IN_SERVICE.indexOf(instance.LifecycleState) >= 0) instancesInService++;

    // Exclude all instances not specified by the command
    if (instancesIds.indexOf(instance.InstanceId) < 0) continue; // eslint-disable-line no-continue

    if (instance.LifecycleState !== 'InService') {
      return Promise.reject(new InvalidOperationError(
        `The instance "${instance.InstanceId}" cannot be entered to standby as its LifecycleState is ${instance.LifecycleState}.`
      ));
    }
    instancesToStandby++;
  }

  return Promise.resolve(instancesInService - instancesToStandby);
}

function predictSizeAfterExitingInstancesFromStandby(autoScalingGroup, instancesIds) {
  let unknownInstanceId = getFirstUnknownInstanceId(autoScalingGroup, instancesIds);
  if (unknownInstanceId) {
    return Promise.reject(new InvalidOperationError(
      `The instance "${unknownInstanceId}" is not part of "${autoScalingGroup.AutoScalingGroupName}" AutoScalingGroup.`
    ));
  }

  let instancesInService = 0;
  let instancesToUnstandby = 0;

  for (let i = 0; i < autoScalingGroup.Instances.length; i++) {
    let instance = autoScalingGroup.Instances[i];

    // Counting all instances that are or will be InService
    if (STATES_AS_IN_SERVICE.indexOf(instance.LifecycleState) >= 0) instancesInService++;

    // Exclude all instances not specified by the command
    if (instancesIds.indexOf(instance.InstanceId) < 0) continue; // eslint-disable-line no-continue

    if (instance.LifecycleState !== 'Standby') {
      return Promise.reject(new InvalidOperationError(
        `The instance "${instance.InstanceId}" cannot be exited from standby as its LifecycleState is ${instance.LifecycleState}.`
      ));
    }

    instancesToUnstandby++;
  }

  return Promise.resolve(instancesInService + instancesToUnstandby);
}

module.exports = {
  predictSizeAfterEnteringInstancesToStandby,
  predictSizeAfterExitingInstancesFromStandby
};
