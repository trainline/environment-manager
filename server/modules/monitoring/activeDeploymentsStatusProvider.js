/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let ms = require('ms');
let _ = require('lodash');

let DEPLOYMENT_MAXIMUM_THRESHOLD = ms('90m');
let DEPLOYMENT_MINIMUM_THRESHOLD = ms('30s');
let DEFAULT_SERVICE_INSTALLATION_TIMEOUT = '30m';

let Enums = require('Enums');
let BaseError = require('modules/errors/BaseError.class');
let sender = require('modules/sender');
let infrastructureConfigurationProvider = require('modules/provisioning/infrastructureConfigurationProvider');
let namingConventionProvider = require('modules/provisioning/namingConventionProvider');
let logger = require('modules/logger');
let deploymentRepository = require('modules/deployment/deploymentRepository');
let utils = require('modules/utilities');

let Environment = require('models/Environment');

module.exports = {

  all: function () {
    return co(function* () {
      let activeDeployments = yield getActiveDeploymentsFromHistoryTable();
      logger.debug(`DeploymentMonitor: ${activeDeployments.length} deployments found to monitor.`);

      return activeDeployments;
    }).catch(error => {
      var message = (error instanceof BaseError) ? error.toString(true) : error.stack;
      logger.error('DeploymentMonitor: An error has occurred getting active deployments: ' + message);

      return Promise.reject(error);
    });
  },

  getActiveDeploymentsFullStatus: function (activeDeployments) {
    return Promise.all(activeDeployments.map(
      activeDeployment => getActiveDeploymentFullStatus(activeDeployment)
    ));
  },

};

function getActiveDeploymentsFromHistoryTable() {
  let expectedStatus = 'In Progress';
  let minimumRangeDate = utils.offsetMilliseconds(new Date(), -DEPLOYMENT_MAXIMUM_THRESHOLD).toISOString();
  let maximumRangeDate = utils.offsetMilliseconds(new Date(), -DEPLOYMENT_MINIMUM_THRESHOLD).toISOString();

  let query = {
    name: 'ScanCrossAccountDynamoResources',
    resource: 'deployments/history',
    filter: {
      'Value.Status': expectedStatus,
      $date_from: minimumRangeDate,
      $date_to: maximumRangeDate,
      'Value.SchemaVersion': 2,
    },
  };

  return sender.sendQuery({ query: query });
}

function getActiveDeploymentFullStatus(activeDeployment) {
  let deploymentId = activeDeployment.DeploymentID;
  let environmentName = activeDeployment.Value.EnvironmentName;
  let serviceName = activeDeployment.Value.ServiceName;
  let serviceVersion = activeDeployment.Value.ServiceVersion;
  let accountName = activeDeployment.AccountName;

  return co(function* () {

    let data = yield {
      nodesId: getExpectedNodesIdByDeployment(activeDeployment),
      serviceInstallation: getTargetState(
        `environments/${environmentName}/services/${serviceName}/${serviceVersion}/installation`,
        environmentName,
        true
      ),
      nodesDeployment: getTargetState(
        `deployments/${deploymentId}/nodes/`,
        environmentName,
        true
      ),
    };

    let nodesDeployment = getNodesDeployment(data.nodesId, data.nodesDeployment);
    let installationTimeout = data.serviceInstallation.length ? data.serviceInstallation[0].value.InstallationTimeout : DEFAULT_SERVICE_INSTALLATION_TIMEOUT;

    let activeDeploymentFullStatus = {
      deploymentId: deploymentId,
      environmentName: environmentName,
      accountName: accountName,
      installationTimeout: ms(`${installationTimeout}m`),
      startTime: new Date(activeDeployment.Value.StartTimestamp),
      nodesDeployment: nodesDeployment,
    };

    logger.debug(`DeploymentMonitor: Deployment '${deploymentId}' is going to affect following nodes ${JSON.stringify(nodesDeployment)}`);

    return activeDeploymentFullStatus;

  }).catch((error) => {
    let errorString = `An error has occurred getting deployment '${deploymentId}' status: ${error.toString(true)}`;
    logger.error(errorString);

    return Promise.resolve({
      deploymentId: deploymentId,
      error: errorString,
      environmentName: environmentName,
      accountName: accountName,
    });
  });
}

function getNodesDeployment(nodesId, nodesDeployment) {
  let mapping = nodesId.map(nodeId => {
    let nodeDeployment = nodesDeployment
      .filter(x => x.key.indexOf(`/nodes/${nodeId}`) >= 0)
      .map(x => x.value)[0];

    let result = {
      InstanceId: nodeId,
      Status: Enums.NodeDeploymentStatus.NotStarted,
    };

    if (!nodeDeployment) return result;

    for (let propertyName in nodeDeployment) {
      let property = nodeDeployment[propertyName];
      if (!property) continue;
      result[propertyName] = property;
    }

    return result;
  });

  return mapping;
}

// TODO(filip): pass model rather than operate on raw DynamoDB data ffs!!!
function getExpectedNodesIdByDeployment(deployment) {
  return co(function* () {

    let serverRoleName;
    // Old deployment - TODO(filip): remove that once we're successful
    if (deployment.Value.ServerRoleName === undefined) {
      let environment = yield Environment.getByName(deployment.Value.EnvironmentName);
      let deploymentMap = yield environment.getDeploymentMap();
      let serverRoles = _.map(yield deploymentMap.getServerRolesByServiceName(deployment.Value.ServiceName), 'ServerRoleName');
      serverRoleName = serverRoles[0];
      logger.info(`DeploymentMonitor: Picked deployment from old monitor: ${serverRoleName}`);
    } else {
      serverRoleName = deployment.Value.ServerRoleName;
    }

    let configuration = yield infrastructureConfigurationProvider.get(
      deployment.Value.EnvironmentName, deployment.Value.ServiceName, serverRoleName
    );

    let autoScalingGroupName = namingConventionProvider.getAutoScalingGroupName(
      configuration, deployment.Value.ServiceSlice
    );

    let query = {
      name: 'GetAutoScalingGroup',
      accountName: deployment.AccountName,
      autoScalingGroupName: autoScalingGroupName,
    };

    try {
      let autoScalingGroup = yield sender.sendQuery({ query });
      let nodeIds = autoScalingGroup.Instances
        .filter(instance => instance.LifecycleState === 'InService')
        .map(instance => instance.InstanceId);
      return nodeIds;
    } catch (err) {
      logger.error(`Couldn't find AutoScalingGroup - it's not in cached array?`);
      logger.error(err);
      return [];
    }
    
  });
}

function getTargetState(key, environmentName, recurse) {
  var query = {
    name: 'GetTargetState',
    environment: environmentName,
    key: key,
    recurse: recurse,
  };

  return sender.sendQuery({ query: query });
}
