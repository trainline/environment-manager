/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let serviceTargets = require('../../modules/service-targets');

module.exports = function SetTargetMaintenanceState(command) {
  let accountName = command.accountName;
  let environment = command.instance.getTag('Environment');
  let host = command.instance.PrivateIpAddress;
  let enable = command.enable;

  return serviceTargets.setInstanceMaintenanceMode(accountName, host, environment, enable);
};
