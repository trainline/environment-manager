/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let getASG = require('modules/queryHandlersUtil/getASG');

module.exports = function GetAutoScalingGroup(query) {
  assert(query.accountName);
  assert(query.autoScalingGroupName);

  return getASG(query);
};
