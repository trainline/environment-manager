/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let serviceDiscovery = require('modules/service-discovery');
let serviceTargets = require('modules/service-targets');
let _ = require('lodash');
let co = require('co');
let Enums = require('Enums');
let DIFF_STATE = Enums.DIFF_STATE;
let DEPLOYMENT_STATUS = Enums.DEPLOYMENT_STATUS;
let logger = require('modules/logger');

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
  checks = _.filter(checks, { ServiceID: serviceId });
  return _.map(checks, (check) => {
    return {
      CheckId: check.CheckID,
      Name: check.Name,
      Notes: check.Notes,
      Status: check.Status,
    };
  });
}

function getInstanceDeploymentStatus(services) {
  let instanceDeploymentStatus;
  let expectedServices = _.filter(services, (service) => {
    return service.DiffWithTargetState !== DIFF_STATE.Unexpected;
  });

  if (_.some(expectedServices, (service) => {
    // If any service deployment is unsuccessful, instance deployment status is also unsuccessful
    return service.DeploymentStatus === DEPLOYMENT_STATUS.Failed;
  })) {
    return DEPLOYMENT_STATUS.Failed;
  } else if(_.every(services, { DeploymentStatus: DEPLOYMENT_STATUS.Success })) {
    return DEPLOYMENT_STATUS.Success;
  } else {
    // This should happen if there's no "Failed" and at least one "In Progress" deployment
    return DEPLOYMENT_STATUS.InProgress;
  }

}

/**
 * Service in Consul is prefixed with env, ie. "c50-ServiceName", we need to drop environment
 */
function getSimpleServiceName(name) {
  return name.split('-')[1];
}

function getServiceAndSlice(obj) {
  return obj.Name + (obj.Slice !== 'none' ? '-' + obj.Slice : '');
}

module.exports = function getInstanceState(accountName, environmentName, nodeName, instanceId, runtimeServerRoleName, instanceLaunchTime) {
  return co(function* () {
    let response = yield {
      checks: serviceDiscovery.getNodeHealth(environmentName, nodeName),
      node: serviceDiscovery.getNode(environmentName, nodeName),
    };
    let checks = response.checks;
    let node = response.node;
    let services = node ? node.Services : [];

    let targetServiceStates = yield serviceTargets.getAllServiceTargets(environmentName, runtimeServerRoleName);

    services = yield _.map(services, co.wrap(function* (service, key) {
      service.Tags = mapConsulTags(service.Tags);
      let instanceServiceHealthChecks = getInstanceServiceHealthChecks(checks, service.ID);
      let targetService = _.find(targetServiceStates, { Name: getSimpleServiceName(service.Service), Slice: service.Tags.slice });
      if (targetService === undefined) {
        // It's not EM deployed service
        return false;
      }
      let deploymentId = _.get(targetService, 'DeploymentId') || null;
      let instanceDeploymentInfo = yield serviceTargets.getInstanceServiceDeploymentInfo(environmentName, deploymentId, instanceId);
      if (instanceDeploymentInfo === undefined) {
        logger.warn(`No deployment info found in Consul Key value store for ${service.Service}, ${environmentName}, ${deploymentId}, ${instanceId}`);
        return false;
      }
      let deploymentStatus = instanceDeploymentInfo.Status;


      // Note: we use DeploymentId from targetService, because DeploymentId from catalog might be old - in case
      // last deployment was unsuccessful
      return {
        Name: getSimpleServiceName(service.Service),
        Version: service.Tags.version,
        Slice: service.Tags.slice,
        Cluster: service.Tags.owning_cluster,
        ServerRole: service.Tags.server_role,
        DeploymentId: deploymentId,
        DeploymentStatus: deploymentStatus,
        DeploymentCause: yield serviceTargets.getServiceDeploymentCause(environmentName, deploymentId, instanceId),
        LogLink: `/api/v1/deployments/${deploymentId}/log?account=${accountName}&instance=${instanceId}`,
        OverallHealth: getInstanceServiceOverallHealth(instanceServiceHealthChecks),
        HealthChecks: instanceServiceHealthChecks,
        DiffWithTargetState: null,
        Issues: { Warnings: [], Errors: [] },
      };
    }));
    // If false, it's not EM deployed service        
    services = _.compact(services);

    // Now make a diff with target state of Instance services
    // Primo, find any services that are in target state, but not on instance
    _.each(targetServiceStates, (targetService) => {
      if (_.find(services, { Name: targetService.Name, Slice: targetService.Slice }) === undefined) {

        // Give service 60 minutes as 'missing' before concluding that service won't get installed on instance for whatever reasons
        let deploymentStatus;
        let timeoutDateMs = new Date(instanceLaunchTime).getTime() + (60*60*1000);
        if (timeoutDateMs > new Date().getTime()) {
          deploymentStatus = DEPLOYMENT_STATUS.InProgress;
        } else {
          deploymentStatus = DEPLOYMENT_STATUS.Failed;
        }

        let missingService = {
          Name: targetService.Name,
          Version: targetService.Version,
          Slice: targetService.Slice,
          DeploymentId: targetService.DeploymentId,
          DeploymentStatus: deploymentStatus,
          Action: targetService.Action,
          HealthChecks: [],
          LogLink: `/api/v1/deployments/${targetService.DeploymentId}/log?account=${accountName}&instance=${instanceId}`,
          OverallHealth: Enums.HEALTH_STATUS.Missing,
          DiffWithTargetState: (targetService.Action === Enums.ServiceAction.INSTALL ? DIFF_STATE.Missing : DIFF_STATE.Ignored),
          Issues: { Warnings: [], Errors: [] }
        };
        if (targetService.Action === Enums.ServiceAction.INSTALL) {
          missingService.Issues.Warnings.push(`Service that is in target state is missing`);
        }
        services.push(missingService);
      }
    });

    // Secondo, find any services that are present on instance, but not in target state
    _.each(services, (instanceService) => {
      // If DiffWithTargetState is present, it's a placeholder - it's not present on instance
      if (instanceService.DiffWithTargetState !== null) {
        return;
      }
      let targetState = _.find(targetServiceStates, { Name: instanceService.Name, Slice: instanceService.Slice });
      if (targetState === undefined) {
        instanceService.Issues.Warnings.push(`Service not found in target state for server role that instance belongs to: "${runtimeServerRoleName}"`);
        instanceService.DiffWithTargetState = DIFF_STATE.Unexpected;
      } else if (targetState.Action !== Enums.ServiceAction.INSTALL) {
        instanceService.Issues.Warnings.push(`Service found in target state for server role that instance belongs to: "${runtimeServerRoleName}", but with Action different from "Install": ${targetState.Action}`);
        instanceService.DiffWithTargetState = DIFF_STATE.Unexpected;
      }
    });

    _.map(services, (service) => {
      service.NameAndSlice = getServiceAndSlice(service);
      return service;
    });

    let runningServicesCount = _.filter(services, (s) => s.DiffWithTargetState !== DIFF_STATE.Missing).length;
    let missingOrUnexpectedServices = _.filter(services, (s) => s.DiffWithTargetState === DIFF_STATE.Missing || s.DiffWithTargetState === DIFF_STATE.Unexpected).length > 0;

    return {
      OverallHealth: getOverallHealth(checks),
      DeploymentStatus: getInstanceDeploymentStatus(services),
      RunningServicesCount: runningServicesCount,
      MissingOrUnexpectedServices: missingOrUnexpectedServices,
      Services: services,
    };
  });
};
