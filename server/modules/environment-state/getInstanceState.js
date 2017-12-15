/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let serviceDiscovery = require('../service-discovery');
let serviceTargets = require('../service-targets');
let _ = require('lodash');
let co = require('co');
let Enums = require('../../Enums');
let DIFF_STATE = Enums.DIFF_STATE;
let DEPLOYMENT_STATUS = Enums.DEPLOYMENT_STATUS;
let serviceUtil = require('./serviceStateUtils');

/**
 * Returns a detailed view of the current state of a given instance and its services
 */
function getInstanceState(accountName, environmentName, nodeName, instanceId, runtimeServerRoleName, instanceLaunchTime) {
  return co(function* () {
    // Get info on 'current state' of services from consul
    let response = yield {
      checks: serviceDiscovery.getNodeHealth(environmentName, nodeName),
      node: serviceDiscovery.getNode(environmentName, nodeName)
    };
    let checks = response.checks;
    let node = response.node;
    let services = node ? node.Services : [];

    // Get info on 'target state'
    let targetServiceStates = yield serviceTargets.getAllServiceTargets(environmentName, runtimeServerRoleName);

    // Combine consul service info with target state info and remove redundant service values
    let consulServiceContext = { checks, targetServiceStates, environmentName, instanceId, accountName };
    services = yield _.map(services, co.wrap(describeConsulService.bind(this, consulServiceContext)));
    services = _.compact(services);

    // Find missing services (in target state but not on instance)
    _.each(targetServiceStates, findMissingServices.bind(this, { services, accountName, instanceId, instanceLaunchTime }));
    // Find unexpected services (on instance but not in target state)
    _.each(services, findUnexpectedServices.bind(this, { targetServiceStates, runtimeServerRoleName }));
    // Set convenience name value
    _.each(services, (service) => { service.NameAndSlice = serviceUtil.getServiceAndSlice(service); });

    return {
      OverallHealth: serviceUtil.getOverallHealth(checks),
      DeploymentStatus: serviceUtil.getInstanceDeploymentStatus(services),
      RunningServicesCount: serviceUtil.getRunningServicesCount(services),
      MissingOrUnexpectedServices: serviceUtil.hasMissingOrUnexpectedServices(services),
      Services: services
    };
  });
}

/**
 * Augments a service object retrieved from consul with extra information
 *
 * @param context {object} Context info on healthchecks, target states, environment, instance & account
 * @param service {object} The service value from consul
 * @returns {object} A new object combining context info with consul service info
 */
function* describeConsulService(context, service) {
  let { checks, targetServiceStates, environmentName, instanceId, accountName } = context;
  service.Tags = serviceUtil.mapConsulTags(service.Tags);

  let targetService = _.find(targetServiceStates, {
    Name: serviceUtil.getSimpleServiceName(service.Service), Slice: service.Tags.slice });

  let deploymentId = _.get(targetService, 'DeploymentId') || service.Tags.deployment_id;

  if (!deploymentId) return false; // It's not EM deployed service

  let instanceDeploymentInfo = yield serviceTargets.getInstanceServiceDeploymentInfo(environmentName, deploymentId, instanceId);
  let deploymentStatus = instanceDeploymentInfo ? instanceDeploymentInfo.Status : 'Success';
  let logURL = serviceUtil.getLogUrl(deploymentId, accountName, instanceId);
  let deploymentCause = yield serviceTargets.getServiceDeploymentCause(environmentName, deploymentId, instanceId);
  // Note: we use DeploymentId from targetService, because DeploymentId from catalog might be old - in case
  // last deployment was unsuccessful
  return serviceUtil.formatConsulService(service, checks, deploymentId, deploymentStatus, deploymentCause, logURL);
}

/**
 * Finds services defined in target state but not present on instance.
 * Missing services are added to the {context.services} array in place.
 *
 * @param context {object} Context info on instance services, account, instance id and launch time
 * @param targetService {object} The target service to look for on the instance
 */
function findMissingServices(context, targetService) {
  let { services, accountName, instanceId, instanceLaunchTime } = context;

  if (_.find(services, { Name: targetService.Name, Slice: targetService.Slice }) === undefined) {
    if (targetService.Action === Enums.ServiceAction.IGNORE) {
      return; // Don't include ignored services
    }
    // Allow 60 minutes 'missing' before concluding that service won't get installed on instance
    let deploymentStatus;
    let timeoutDateMs = new Date(instanceLaunchTime).getTime() + (60 * 60 * 1000);
    if (timeoutDateMs > new Date().getTime()) {
      deploymentStatus = DEPLOYMENT_STATUS.InProgress;
    } else {
      deploymentStatus = DEPLOYMENT_STATUS.Failed;
    }
    let logURL = serviceUtil.getLogUrl(targetService.DeploymentId, accountName, instanceId);
    let missingService = serviceUtil.formatMissingService(targetService, deploymentStatus, logURL);
    services.push(missingService);
  }
}

/**
 * Finds services present on an instance that aren't defined in the target state.
 * Adds a warning attribute to any unexpected services
 *
 * @param context {object} Context info on target states and server role
 * @param instanceService {object} The service to interrogate
 */
function findUnexpectedServices(context, instanceService) {
  let { targetServiceStates, runtimeServerRoleName } = context;
  // If DiffWithTargetState is present, it's a placeholder - it's not present on instance
  if (instanceService.DiffWithTargetState !== null) {
    return;
  }
  let targetState = _.find(targetServiceStates, { Name: instanceService.Name, Slice: instanceService.Slice });

  if (targetState === undefined) {
    instanceService.Issues.Warnings.push(
      `Service missing in target state for server role "${runtimeServerRoleName}"`);
    instanceService.DiffWithTargetState = DIFF_STATE.Unexpected;
  } else if (targetState.Action !== Enums.ServiceAction.INSTALL) {
    instanceService.Issues.Warnings.push(
      `Service for server role "${runtimeServerRoleName}" is marked for "${targetState.Action}" action`);
    instanceService.DiffWithTargetState = DIFF_STATE.Unexpected;
  }
}

module.exports = getInstanceState;
