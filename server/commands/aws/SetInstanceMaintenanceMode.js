/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let resourceProvider = require('modules/resourceProvider');
let serviceUpdater = require('modules/service-updater');

module.exports = function SetTargetMaintenanceState(command) {
  let accountName = command.accountName;
  let environment = command.instance.getTag('Environment');
  let host = command.instance.PrivateIpAddress;
  let enable = command.enable;

  return serviceUpdater.setInstanceMaintenanceMode(accountName, host, environment, enable);
};
