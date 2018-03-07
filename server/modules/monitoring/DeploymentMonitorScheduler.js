/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const logger = require('../logger');
const deploymentMonitor = require('./DeploymentMonitor');
const clusterNode = require('../clusterNode');

const MAX_MONITOR_INTERVAL = 60;
const MIN_MONITOR_INTERVAL = 45;

let monitorInterval = 0;

function scheduleDeploymentMonitor(isPeakTime) {
  let interval = getDeploymentMonitorInterval(isPeakTime);

  logger.debug(`DeploymentMonitor: Next execution will start in ${interval} seconds`);

  setTimeout(() => {
    monitorActiveDeployments().then(

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

function monitorActiveDeployments() {
  if (!clusterNode.isLeader()) return Promise.resolve(0);
  return deploymentMonitor.monitorActiveDeployments();
}

function getDeploymentMonitorInterval(isPeakTime) {
  if (isPeakTime) {
    monitorInterval = 0;
  } else {
    monitorInterval *= 2;
  }

  if (monitorInterval > MAX_MONITOR_INTERVAL) {
    monitorInterval = MAX_MONITOR_INTERVAL;
  } else if (monitorInterval < MIN_MONITOR_INTERVAL) {
    monitorInterval = MIN_MONITOR_INTERVAL;
  }

  return monitorInterval;
}

module.exports = {
  start() {
    scheduleDeploymentMonitor(false);
  }
};
