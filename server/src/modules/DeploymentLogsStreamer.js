/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let { appendLogEntries } = require('./data-access/deployments');
let logger = require('./logger');
let timer = require('timers');

module.exports = function DeploymentLogsStreamer() {
  let pendingLogEntries = (() => {
    let state = new Map();
    return {
      add: (deploymentId, message) => {
        if (!state.has(deploymentId)) {
          state.set(deploymentId, []);
        }
        state.get(deploymentId).push(message);
      },
      deploymentIds: () => Array.from(state.keys()),
      getByDeploymentId: deploymentId => state.get(deploymentId) || [],
      removeByDeploymentId: deploymentId => state.delete(deploymentId)
    };
  })();

  function logWriteErrors(result) {
    if (result.error) {
      logger.error(result.error);
      logger.error(`Failed to flush pending log entries for deployment ${result.deploymentId}:
${result.logEntries.join('\n')}`);
    }
    return result;
  }

  function flushPendingLogEntries(deploymentId) {
    let key = { DeploymentID: deploymentId };

    let logEntries = pendingLogEntries.getByDeploymentId(deploymentId);
    pendingLogEntries.removeByDeploymentId(deploymentId);
    return appendLogEntries({ logEntries, key })
      .then(() => ({ deploymentId }))
      .catch(error => logWriteErrors({ deploymentId, logEntries, error }));
  }

  timer.setInterval(() => {
    let promises = pendingLogEntries.deploymentIds().map(flushPendingLogEntries);
    Promise.all(promises).catch(
      (error) => {
        logger.error(`An error has occurred streaming logs to DynamoDB: ${error.message}`);
      }
    );
  }, 1000);

  this.log = (deploymentId, message) => {
    let timestamp = new Date().toISOString();
    pendingLogEntries.add(deploymentId, `[${timestamp}] ${message}`);
  };

  this.flush = flushPendingLogEntries;
};
