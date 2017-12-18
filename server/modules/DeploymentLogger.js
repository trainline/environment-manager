/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let systemUser = require('./systemUser');
let sender = require('./sender');
let deployments = require('./data-access/deployments');
let DeploymentLogsStreamer = require('./DeploymentLogsStreamer');
let deploymentLogsStreamer = new DeploymentLogsStreamer();
let Enums = require('../Enums');
let logger = require('./logger');
let UpdateTargetState = require('../commands/services/UpdateTargetState');

module.exports = {
  started(deployment, accountName) {
    let record = {
      AccountName: deployment.accountName,
      DeploymentID: deployment.id,
      Value: {
        DeploymentType: 'Parallel',
        EnvironmentName: deployment.environmentName,
        EnvironmentType: deployment.environmentTypeName,
        OwningCluster: deployment.clusterName,
        SchemaVersion: 2,
        ServiceName: deployment.serviceName,
        ServiceSlice: deployment.serviceSlice,
        ServiceVersion: deployment.serviceVersion,
        RuntimeServerRoleName: deployment.serverRole,
        ServerRoleName: deployment.serverRoleName,
        Status: 'In Progress',
        User: deployment.username,
        StartTimestamp: new Date().toISOString(),
        EndTimestamp: null,
        ExecutionLog: []
      }
    };

    return deployments.create(record).then(() => {
      deploymentLogsStreamer.log(deployment.id, accountName, 'Deployment started');
    });
  },

  inProgress(deploymentId, message) {
    deploymentLogsStreamer.log(deploymentId, message);
  },

  updateStatus(deploymentStatus, newStatus) {
    let logError = error => logger.error(error);

    logger.debug(`Updating deployment '${deploymentStatus.deploymentId}' status to '${newStatus.name}'`);

    /**
     * flush log entries before changing status. A status change may move
     * the record to another table. If this occurs before the log entries
     * are flushed then the log entries may not be written.
     */
    return updateDeploymentTargetState(deploymentStatus, newStatus)
      .catch(logError)
      .then(() => deploymentLogsStreamer.log(deploymentStatus.deploymentId, newStatus.reason))
      .then(() => deploymentLogsStreamer.flush(deploymentStatus.deploymentId))
      .catch(logError)
      .then(() => updateDeploymentDynamoTable(deploymentStatus, newStatus))
      .catch(logError);
  }
};

function updateDeploymentDynamoTable(deploymentStatus, newStatus) {
  let { Success, InProgress } = Enums.DEPLOYMENT_STATUS;
  let running = newStatus.name === InProgress;
  let succeeded = newStatus.name === Success;

  let updateExpression = ['update',
    ['set', ['at', 'Value', 'Status'], ['val', newStatus.name]],
    ['set', ['at', 'Value', 'Nodes'], ['val', deploymentStatus.nodesDeployment || []]]
  ];

  if (!running && !succeeded && newStatus.reason !== undefined) {
    updateExpression.push(['set', ['at', 'Value', 'ErrorReason'], ['val', newStatus.reason]]);
  }
  if (!running) {
    updateExpression.push(['set', ['at', 'Value', 'EndTimestamp'], ['val', new Date().toISOString()]]);
  }

  return deployments.update({ key: { DeploymentID: deploymentStatus.deploymentId }, updateExpression });
}

function updateDeploymentTargetState(deploymentStatus, newStatus) {
  let command = {
    deploymentId: deploymentStatus.deploymentId,
    name: 'UpdateTargetState',
    environment: deploymentStatus.environmentName,
    key: `deployments/${deploymentStatus.deploymentId}/overall_status`,
    value: newStatus.name
  };

  return sender.sendCommand(UpdateTargetState, { command, user: systemUser });
}
