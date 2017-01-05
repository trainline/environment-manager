/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let logger = require('modules/logger');
let deploymentMonitor = require('modules/monitoring/DeploymentMonitor');
const MAX_MONITOR_INTERVAL = 60;
const MIN_MONITOR_INTERVAL = 45;

let _monitorInterval = 0;

function scheduleDeploymentMonitor(isPeakTime) {
  var interval = getDeploymentMonitorInterval(isPeakTime);

  logger.debug(`DeploymentMonitor: Next execution will start in ${interval} seconds`);

  setTimeout(() => {

    deploymentMonitor.monitorActiveDeployments().then(

      (activeDeploymentsMonitored) => {
        scheduleDeploymentMonitor(activeDeploymentsMonitored > 0);
      },

      (error) => {
        logger.error(`DeploymentMonitor: An error has occurred: ${error.toString(true)}`);
        scheduleDeploymentMonitor(false);
      }

    );

  }, interval * 1000);
}

function getDeploymentMonitorInterval(isPeakTime) {
  if (isPeakTime) {
    _monitorInterval = 0;
  } else {
    _monitorInterval *= 2;
  }

  if (_monitorInterval > MAX_MONITOR_INTERVAL) {
    _monitorInterval = MAX_MONITOR_INTERVAL;
  } else if (_monitorInterval < MIN_MONITOR_INTERVAL) {
    _monitorInterval = MIN_MONITOR_INTERVAL;
  }

  return _monitorInterval;
}

module.exports = {
  start: function () {
    scheduleDeploymentMonitor(false);
  },
};
