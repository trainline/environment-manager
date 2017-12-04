/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let fs = require('fs');
let co = require('co');
let ms = require('ms');
let logger = require('../logger');
let activeDeploymentsStatusProvider = require('./activeDeploymentsStatusProvider');

let DEFAULT_INFRASTRUCTURE_PROVISIONING_TIMEOUT = '60m';
let Enums = require('../../Enums');
let NodeDeploymentStatus = require('../../Enums').NodeDeploymentStatus;
let deploymentLogger = require('../DeploymentLogger');

module.exports = {
  detectNodesDeploymentStatus,
  monitorActiveDeployments() {
    try {
      let stats = fs.lstatSync('DONT_RUN_DEPLOYMENT_MONITOR');
      if (stats.isFile()) {
        // Return 0 monitored deployments
        logger.info('DeploymentMonitor: DONT_RUN_DEPLOYMENT_MONITOR env is defined, so not running');
        return Promise.resolve(0);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        // If error is other than not found file, rethrow
        throw err;
      }
    }

    return co(function* () {
      let activeDeployments = yield activeDeploymentsStatusProvider.all();
      let activeDeploymentsStatus = yield activeDeploymentsStatusProvider.getActiveDeploymentsFullStatus(activeDeployments);

      yield activeDeploymentsStatus.map(
        activeDeploymentStatus => monitorActiveDeploymentStatus(activeDeploymentStatus)
      );

      return activeDeploymentsStatus.length;
    });
  }
};

function monitorActiveDeploymentStatus(deploymentStatus) {
  return co(function* () {
    if (deploymentStatus.error) {
      if (deploymentStatus.error.indexOf('Missing credentials in config') !== -1) {
        // That is to not modify deployment if we catch mysterious 'Missing credentials' from AWS
        return;
      }

      let newStatus = {
        name: Enums.DEPLOYMENT_STATUS.Failed,
        reason: sanitiseError(deploymentStatus.error)
      };
      deploymentLogger.updateStatus(deploymentStatus, newStatus);
      return;
    }

    // Checking the overall deployment execution time does not exceeded the timeout.
    // This execution time takes into account creation of AWS expected infrastructure,
    // EC2 Instances bootstrapping, and service installation on them.
    if (isOverallDeploymentTimedOut(deploymentStatus.startTime)) {
      let newStatus = {
        name: Enums.DEPLOYMENT_STATUS.Failed,
        reason: `Deployment failed because exceeded overall timeout of ${DEFAULT_INFRASTRUCTURE_PROVISIONING_TIMEOUT}`
      };
      deploymentLogger.updateStatus(deploymentStatus, newStatus);
      return;
    }

    timeOutNodes(deploymentStatus.nodesDeployment, deploymentStatus.installationTimeout);
    let newStatus = detectNodesDeploymentStatus(deploymentStatus.nodesDeployment);

    logger.debug(`DeploymentMonitor: Deployment '${deploymentStatus.deploymentId}' nodes status is ${JSON.stringify(newStatus)}`);

    if (newStatus.name === Enums.DEPLOYMENT_STATUS.InProgress) {
      return;
    }

    if (newStatus.name === Enums.DEPLOYMENT_STATUS.Success || newStatus.name === Enums.DEPLOYMENT_STATUS.Failed) {
      deploymentLogger.updateStatus(deploymentStatus, newStatus);
    }
  });
}

function sanitiseError(error) {
  if (_.isObjectLike(error)) { return JSON.stringify(error); }
  return error.toString(true);
}

function isOverallDeploymentTimedOut(deploymentStartTime) {
  let initialTime = new Date(deploymentStartTime);
  let currentTime = new Date();
  let elapsedMs = currentTime.getTime() - initialTime.getTime();

  let timedOut = elapsedMs > ms(DEFAULT_INFRASTRUCTURE_PROVISIONING_TIMEOUT);

  return timedOut;
}

function detectNodesDeploymentStatus(nodes) {
  let totalNodeCount = nodes.length;

  if (totalNodeCount < 1) {
    // There are no nodes yet. Maybe an ASG is being created or scaled out from zero?
    return { name: Enums.DEPLOYMENT_STATUS.InProgress };
  }

  if (nodes.every(succeeded)) {
    // Deployment succeeded on every node.
    return {
      name: Enums.DEPLOYMENT_STATUS.Success,
      reason: 'Deployed all nodes successfully'
    };
  }

  if (nodes.every(completed)) {
    let succeededLength = _.filter(nodes, succeeded).length;
    // Deployment completed on every node but did not succeeded on every node.
    return {
      name: Enums.DEPLOYMENT_STATUS.Failed,
      reason: `Deployment failed: deployed ${succeededLength}/${nodes.length} nodes`
    };
  }

  return { name: Enums.DEPLOYMENT_STATUS.InProgress };

  function succeeded(node) {
    return node.Status === NodeDeploymentStatus.Success;
  }

  function completed(node) {
    return node.Status === NodeDeploymentStatus.Success || node.Status === NodeDeploymentStatus.Failed;
  }
}

function timeOutNodes(nodesDeployment, installationTimeout) {
  nodesDeployment.forEach((nodeDeployment) => {
    if (isNodeDeploymentTimedOut(nodeDeployment, installationTimeout)) {
      nodeDeployment.Status = NodeDeploymentStatus.Failed;
      nodeDeployment.LastCompletedStage = 'Timed Out';
    }
  });
}

function isNodeDeploymentTimedOut(nodeDeployment, installationTimeout) {
  if (nodeDeployment.Status !== NodeDeploymentStatus.InProgress) return false;

  let initialTime = new Date(nodeDeployment.StartTime);
  let currentTime = new Date();
  let elapsedMs = currentTime.getTime() - initialTime.getTime();

  let timedOut = elapsedMs > installationTimeout;

  return timedOut;
}
