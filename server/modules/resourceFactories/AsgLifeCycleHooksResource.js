/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let AwsError = require('../errors/AwsError.class');
let AutoScalingGroupNotFoundError = require('../errors/AutoScalingGroupNotFoundError.class');

function AsgLifeCycleHooksResource(client) {
  function describeLifeCycleHooks(name) {
    return client.describeLifecycleHooks({ AutoScalingGroupName: name }).promise();
  }

  this.get = function (parameters) {
    return describeLifeCycleHooks(parameters.name).then((result) => {
      if (result.LifecycleHooks) {
        return result.LifecycleHooks;
      }
      throw new AutoScalingGroupNotFoundError(`AutoScalingGroup "${parameters.name}" not found.`);
    }).catch((error) => {
      throw new AwsError(error.message);
    });
  };
}

module.exports = AsgLifeCycleHooksResource;
