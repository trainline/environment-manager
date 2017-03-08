/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let systemUser = require('modules/systemUser');
let sender = require('modules/sender');
let DeploymentLogsStreamer = require('modules/DeploymentLogsStreamer');
let deploymentLogsStreamer = new DeploymentLogsStreamer();
let Enums = require('Enums');
let logger = require('modules/logger');

module.exports = {
  started(deployment, accountName) {
    let command = {
      name: 'CreateDynamoResource',
      resource: 'deployments/history',
      accountName,
      key: deployment.id,
      item: {
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
          ExecutionLog: null
        }
      }
    };

    return sender.sendCommand({ command, user: systemUser }).then(() => {
      deploymentLogsStreamer.log(deployment.id, accountName, 'Deployment started');
    });
  },

  inProgress(deploymentId, accountName, message) {
    deploymentLogsStreamer.log(deploymentId, accountName, message);
  },

  updateStatus(deploymentStatus, newStatus) {
    logger.debug(`Updating deployment '${deploymentStatus.deploymentId}' status to '${newStatus.name}'`);

    /**
     * flush log entries before changing status. A status change may move
     * the record to another table. If this occurs before the log entries
     * are flushed then the log entries may not be written.
     */
    return Promise.all([
      Promise.resolve(deploymentLogsStreamer.log(deploymentStatus.deploymentId, deploymentStatus.accountName, newStatus.reason))
        .then(() => deploymentLogsStreamer.flush(deploymentStatus.deploymentId))
        .then(() => updateDeploymentDynamoTable(deploymentStatus, newStatus))
        .catch(error => logger.error(error)),
      updateDeploymentTargetState(deploymentStatus, newStatus).catch(error => logger.error(error))
    ]);
  }
};

function updateDeploymentDynamoTable(deploymentStatus, newStatus) {
  let { Success, InProgress } = Enums.DEPLOYMENT_STATUS;
  let running = newStatus.name === InProgress;
  let succeeded = newStatus.name === Success;
  let item = {
    'Value.Status': newStatus.name,
    'Value.Nodes': deploymentStatus.nodesDeployment || []
  };
  let errorReason = !running && !succeeded && newStatus.reason !== undefined
    ? { 'Value.ErrorReason': newStatus.reason } : {};
  let endTimestamp = running ? {} : { 'Value.EndTimestamp': new Date().toISOString() };

  let command = {
    name: 'UpdateDynamoResource',
    resource: 'deployments/history',
    accountName: deploymentStatus.accountName,
    key: deploymentStatus.deploymentId,
    item: Object.assign({}, item, errorReason, endTimestamp)
  };

  return sender.sendCommand({ command, user: systemUser });
}

function updateDeploymentTargetState(deploymentStatus, newStatus) {
  let command = {
    name: 'UpdateTargetState',
    environment: deploymentStatus.environmentName,
    key: `deployments/${deploymentStatus.deploymentId}/overall_status`,
    value: newStatus.name
  };

  return sender.sendCommand({ command, user: systemUser });
}
