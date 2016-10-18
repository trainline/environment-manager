/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let getASGScheduledActions = require('modules/queryHandlersUtil/getASGScheduledActions');

module.exports = function GetAutoScalingGroupScheduledActions(query) {
  assert(query.accountName);
  assert(query.autoScalingGroupName);

  return getASGScheduledActions(query);
};
