/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let systemUser = require('modules/systemUser');
let sender = require('modules/sender');
let DeploymentLogsStreamer = require('modules/DeploymentLogsStreamer');
let deploymentLogsStreamer = new DeploymentLogsStreamer();
let Enums = require('Enums');
let logger = require('modules/logger');

module.exports = {
  started: function (deployment, accountName) {
    var command = {
      name: 'CreateDynamoResource',
      resource: 'deployments/history',
      accountName: accountName,
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
          ExecutionLog: null,
        },
      },
    };

    return sender.sendCommand({ command: command, user: systemUser }).then(() => {
      deploymentLogsStreamer.log(deployment.id, accountName, 'Deployment started');
    });
  },

  inProgress: function (deploymentId, accountName, message) {
    deploymentLogsStreamer.log(deploymentId, accountName, message);
  },

  updateStatus: function(deploymentStatus, newStatus) {
    logger.debug(`Updating deployment '${deploymentStatus.deploymentId}' status to '${newStatus.name}'`);

    /**
     * flush log entries before changing status. A status change may move
     * the record to another table. If this occurs before the log entries
     * are flushed then the log entries may not be written.
     */
    return Promise.all([
      Promise.resolve(deploymentLogsStreamer.log(deploymentStatus.deploymentId, deploymentStatus.accountName, newStatus.reason))
        .then(() => deploymentLogsStreamer.flush(deploymentStatus.deploymentId))
        .then(() => updateDeploymentDynamoTable(deploymentStatus, newStatus)),
      updateDeploymentTargetState(deploymentStatus, newStatus),
    ]);
  },
};


function updateDeploymentDynamoTable(deploymentStatus, newStatus) {
  let endTimestamp = newStatus.name !== Enums.DEPLOYMENT_STATUS.InProgress ? new Date().toISOString() : undefined;

  let errorReason = null;
  // No error
  if (newStatus.name === Enums.DEPLOYMENT_STATUS.Failed && newStatus.reason !== undefined) {
    errorReason = newStatus.reason;
  }

  let command = {
    name: 'UpdateDynamoResource',
    resource: 'deployments/history',
    accountName: deploymentStatus.accountName,
    key: deploymentStatus.deploymentId,
    item: {
      'Value.Status': newStatus.name,
      'Value.ErrorReason': errorReason,
      'Value.EndTimestamp': endTimestamp,
      'Value.Nodes': deploymentStatus.nodesDeployment || [],
    },
  };

  return sender.sendCommand({ command, user: systemUser });
}

function updateDeploymentTargetState(deploymentStatus, newStatus) {
  let command = {
    name: 'UpdateTargetState',
    environment: deploymentStatus.environmentName,
    key: `deployments/${deploymentStatus.deploymentId}/overall_status`,
    value: newStatus.name,
  };

  return sender.sendCommand({ command, user: systemUser });
}
