/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let systemUser = require('modules/systemUser');
let logger = require('modules/logger');
let sender = require('modules/sender');

module.exports = function DeploymentLogsStreamer() {
  let deploymentLogStreams = {};
  let isRunning = false; // eslint-disable-line no-unused-vars

  this.log = function (deploymentId, accountName, message) {
    let logStreams = getLogStreamsByDeploymentIdAndAccountName(deploymentId, accountName);
    let timestamp = new Date().toISOString();

    logStreams.logs.push(`[${timestamp}] ${message}`);
  };

  function getLogStreamsByDeploymentIdAndAccountName(deploymentId, accountName) {
    let logStreams = deploymentLogStreams[deploymentId];
    if (!logStreams) {
      logStreams = {
        deploymentId,
        accountName,
        logs: [],
      };

      deploymentLogStreams[deploymentId] = logStreams;
    }

    return logStreams;
  }

  function getDeploymentHistory(deploymentId, accountName) {
    let query = {
      name: 'GetDynamoResource',
      resource: 'deployments/history',
      accountName,
      key: deploymentId,
    };

    return sender.sendQuery({ query });
  }

  function flushLogStream(logStream) {
    return co(function* () {
      let deploymentHistory = yield getDeploymentHistory(
        logStream.deploymentId, logStream.accountName
      );

      let executionLog = deploymentHistory.Value.ExecutionLog;
      let executionLogEntries = executionLog ? executionLog.split('\n') : [];

      executionLogEntries = executionLogEntries.concat(logStream.logs);

      let command = {
        name: 'UpdateDynamoResource',
        resource: 'deployments/history',
        accountName: logStream.accountName,
        key: logStream.deploymentId,
        item: {
          'Value.ExecutionLog': executionLogEntries.join('\n'),
        },
      };

      yield sender.sendCommand({ command, user: systemUser });
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
      () => {
        isRunning = false;
      },

      (error) => {
        isRunning = false;
        logger.error(`An error has occurred streaming logs to DynamoDB: ${error.message}`);
      }
    );
  }, 1000);
};
