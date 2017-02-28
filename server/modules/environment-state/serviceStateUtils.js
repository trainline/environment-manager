/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let Enums = require('Enums');
let DIFF_STATE = Enums.DIFF_STATE;
let DEPLOYMENT_STATUS = Enums.DEPLOYMENT_STATUS;

function formatConsulService(service, healthchecks, deploymentId, deploymentStatus, deploymentCause, logUrl) {
  let instanceServiceHealthChecks = getInstanceServiceHealthChecks(healthchecks, service.ID);
  return {
    Name: getSimpleServiceName(service.Service),
    Version: service.Tags.version,
    Slice: service.Tags.slice,
    Cluster: service.Tags.owning_cluster,
    ServerRole: service.Tags.server_role,
    DeploymentId: deploymentId,
    DeploymentStatus: deploymentStatus,
    DeploymentCause: deploymentCause,
    LogLink: logUrl,
    OverallHealth: getInstanceServiceOverallHealth(instanceServiceHealthChecks),
    HealthChecks: instanceServiceHealthChecks,
    DiffWithTargetState: null,
    Issues: { Warnings: [], Errors: [] }
  };
}

function formatMissingService(targetService, deploymentStatus, logURL) {
  let missingService = {
    Name: targetService.Name,
    Version: targetService.Version,
    Slice: targetService.Slice,
    DeploymentId: targetService.DeploymentId,
    DeploymentStatus: deploymentStatus,
    Action: targetService.Action,
    HealthChecks: [],
    LogLink: logURL,
    OverallHealth: Enums.HEALTH_STATUS.Missing,
    DiffWithTargetState: (targetService.Action === Enums.ServiceAction.INSTALL ? DIFF_STATE.Missing : DIFF_STATE.Ignored),
    Issues: { Warnings: [], Errors: [] }
  };
  if (targetService.Action === Enums.ServiceAction.INSTALL) {
    missingService.Issues.Warnings.push('Service that is in target state is missing');
  }
  return missingService;
}

function mapConsulTags(tags) {
  return _.reduce(tags, (result, tag) => {
    let spl = tag.split(':');
    result[spl[0]] = spl[1];
    return result;
  }, {});
}

function getOverallHealth(checks) {
  let check = _.find(checks, { CheckID: 'serfHealth' });
  if (check === undefined) {
    return Enums.HEALTH_STATUS.NoData;
  } else if (check.Status === 'passing') {
    return Enums.HEALTH_STATUS.Healthy;
  } else {
    return Enums.HEALTH_STATUS.Error;
  }
}

function getInstanceServiceOverallHealth(checks) {
  if (_.every(checks, { Status: 'passing' })) {
    return Enums.HEALTH_STATUS.Healthy;
  } else {
    return Enums.HEALTH_STATUS.Error;
  }
}

function getInstanceServiceHealthChecks(checks, serviceId) {
  let filteredChecks = _.filter(checks, { ServiceID: serviceId });
  return _.map(filteredChecks, check => ({
    CheckId: check.CheckID,
    Name: check.Name,
    Notes: check.Notes,
    Status: check.Status
  }));
}

function getInstanceDeploymentStatus(services) {
  let expectedServices = _.filter(services, service => service.DiffWithTargetState !== DIFF_STATE.Unexpected);

  if (_.some(expectedServices, service =>
      // If any service deployment is unsuccessful, instance deployment status is also unsuccessful
    service.DeploymentStatus === DEPLOYMENT_STATUS.Failed)) {
    return DEPLOYMENT_STATUS.Failed;
  } else if (_.every(services, { DeploymentStatus: DEPLOYMENT_STATUS.Success })) {
    return DEPLOYMENT_STATUS.Success;
  } else {
    // This should happen if there's no "Failed" and at least one "In Progress" deployment
    return DEPLOYMENT_STATUS.InProgress;
  }
}

function getRunningServicesCount(services) {
  return _.filter(services, s => s.DiffWithTargetState !== DIFF_STATE.Missing).length;
}

function hasMissingOrUnexpectedServices(services) {
  return _.filter(services, s => s.DiffWithTargetState === DIFF_STATE.Missing || s.DiffWithTargetState === DIFF_STATE.Unexpected).length > 0;
}

function getSimpleServiceName(name) {
  return name.split('-')[1];
}

function getServiceAndSlice(obj) {
  return obj.Name + (obj.Slice !== 'none' ? `-${obj.Slice}` : '');
}

function getLogUrl(deploymentId, accountName, instanceId) {
  return `/api/v1/deployments/${deploymentId}/log?account=${accountName}&instance=${instanceId}`;
}

module.exports = {
  mapConsulTags,
  getOverallHealth,
  getInstanceServiceOverallHealth,
  getInstanceServiceHealthChecks,
  getInstanceDeploymentStatus,
  getSimpleServiceName,
  getServiceAndSlice,
  getLogUrl,
  formatConsulService,
  formatMissingService,
  getRunningServicesCount,
  hasMissingOrUnexpectedServices
};
