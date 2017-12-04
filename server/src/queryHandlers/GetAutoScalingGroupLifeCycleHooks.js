/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let co = require('co');
const asgLifeCycleHooksResourceFactory = require('../modules/resourceFactories/asgLifeCycleHooksResourceFactory');

function* GetAutoScalingGroupLifeCycleHooks(query) {
  assert(query.accountName);
  assert(query.autoScalingGroupName);

  // Create an instance of the resource to work with based on the resource
  // descriptor and AWS account name.
  let parameters = { accountName: query.accountName };
  let resource = yield asgLifeCycleHooksResourceFactory.create(undefined, parameters);

  // Get AutoScalingGroup's Scheduled Actions by name
  return resource.get({ name: query.autoScalingGroupName });
}

module.exports = co.wrap(GetAutoScalingGroupLifeCycleHooks);
