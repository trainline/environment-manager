/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let logger = require('modules/logger');
let sender = require('modules/sender');
let assert = require('assert');
let Deployment = require('models/Deployment');

module.exports = function DeploymentLogsStreamer() {

  let deploymentLogStreams = {};
  let isRunning = false;

  this.log = function (deploymentId, accountName, message) {
    let logStreams = getLogStreamsByDeploymentIdAndAccountName(deploymentId);
    let timestamp = new Date().toISOString();

    logStreams.logs.push(`[${timestamp}] ${message}`);
  };

  function getLogStreamsByDeploymentIdAndAccountName(deploymentId) {
    let logStreams = deploymentLogStreams[deploymentId];
    if (logStreams === undefined) {
      logStreams = {
        deploymentId,
        logs: [],
      };

      deploymentLogStreams[deploymentId] = logStreams;
    }

    return logStreams;
  }

  function flushLogStream(logStream) {
    return co(function* () {
      let deployment = yield Deployment.getById(logStream.deploymentId)
      return deployment.addExecutionLogEntries(logStream.logs);
    });
  }

  setInterval(() => {
    isRunning = true;
    let promises = [];
    for (let deploymentId in deploymentLogStreams) {
      let logStream = deploymentLogStreams[deploymentId];
      promises.push(flushLogStream(logStream));
    }

    deploymentLogStreams = {};

    Promise.all(promises).then(
      () => { isRunning = false; },
      (error) => {
        isRunning = false;
        logger.error(`An error has occurred streaming logs to DynamoDB: ${error.message}`);
      }
    );

  }, 1000);

};
