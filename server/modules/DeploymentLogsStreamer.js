/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let systemUser = require('modules/systemUser');
let logger = require('modules/logger');
let sender = require('modules/sender');

module.exports = function DeploymentLogsStreamer() {

  var deploymentLogStreams = {};
  var isRunning = false;

  this.log = function (deploymentId, accountName, message) {
    var logStreams = getLogStreamsByDeploymentIdAndAccountName(deploymentId, accountName);
    var timestamp = new Date().toISOString();

    logStreams.logs.push(`[${timestamp}] ${message}`);
  };

  function getLogStreamsByDeploymentIdAndAccountName(deploymentId, accountName) {
    var logStreams = deploymentLogStreams[deploymentId];
    if (!logStreams) {
      logStreams = {
        deploymentId: deploymentId,
        accountName: accountName,
        logs: [],
      };

      deploymentLogStreams[deploymentId] = logStreams;
    }

    return logStreams;
  }

  function getDeploymentHistory(deploymentId, accountName) {
    var query = {
      name: 'GetDynamoResource',
      resource: 'deployments/history',
      accountName: accountName,
      key: deploymentId,
    };

    return sender.sendQuery({ query: query });
  }

  function flushLogStream(logStream) {
    return co(function* () {
      var deploymentHistory = yield getDeploymentHistory(
        logStream.deploymentId, logStream.accountName
      );

      var executionLog = deploymentHistory.Value.ExecutionLog;
      var executionLogEntries = executionLog ? executionLog.split('\n') : [];

      executionLogEntries = executionLogEntries.concat(logStream.logs);

      var command = {
        name: 'UpdateDynamoResource',
        resource: 'deployments/history',
        accountName: logStream.accountName,
        key: logStream.deploymentId,
        item: {
          'Value.ExecutionLog': executionLogEntries.join('\n'),
        },
      };

      yield sender.sendCommand({ command: command, user: systemUser });
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
