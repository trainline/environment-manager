/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let serviceDiscovery = require('modules/service-discovery');
let serviceTargets = require('modules/service-targets');
let _ = require('lodash');
let co = require('co');
let Enums = require('Enums');

function mapConsulTags(tags) {
  return _.reduce(tags, function (result, tag) {
    var spl = tag.split(':');
    result[spl[0]] = spl[1];
    return result;
  }, {});
}

function getOverallHealth(checks) {
  let check = _.find(checks, { CheckID: 'serfHealth' });
  let status;
  if (check === undefined) {
    status = Enums.HEALTH_STATUS.NoData;
  } else if (check.Status === 'passing') {
    status = Enums.HEALTH_STATUS.Healthy;
  } else {
    status = Enums.HEALTH_STATUS.Error;
  }
  
  return {
    Status: status
  };
}

function getInstanceServiceOverallHealth(checks) {
  if (_.some(checks, { Status: 'critical' })) {
    return {
      Status: Enums.HEALTH_STATUS.Error,
    };
  } else {
    return {
      Status: Enums.HEALTH_STATUS.Healthy,
    };
  }
}

function getInstanceServiceHealthChecks(checks, serviceName) {
  checks = _.filter(checks, { ServiceName: serviceName });
  return _.map(checks, (check) => {
    return {
      CheckId: check.CheckID,
      Name: check.Name,
      Status: check.Status
    };
  });
}

/**
 * Service in Consul is prefixed with env, ie. "c50-ServiceName", we need to drop environment
 */
function getSimpleServiceName(name) {
  return name.split('-')[1];
}

module.exports = function getInstanceState(accountName, environmentName, nodeName, instanceId) {
  return co(function* () {
    let response = yield {
      checks: serviceDiscovery.getNodeHealth(environmentName, nodeName),
      node: serviceDiscovery.getNode(environmentName, nodeName),
    };
    let checks = response.checks;
    let node = response.node;
    let services = node ? node.Services : [];

    services = yield _.map(services, co.wrap(function* (service, key) {
      service.Tags = mapConsulTags(service.Tags);
      let instanceServiceHealthChecks = getInstanceServiceHealthChecks(checks, service.Service);
      return {
        Name: getSimpleServiceName(service.Service),
        Version: service.Tags.version,
        Slice: service.Tags.slice,
        Cluster: service.Tags.owning_cluster,
        ServerRole: service.Tags.server_role,
        DeploymentId: service.Tags.deployment_id,
        DeploymentCause: yield serviceTargets.getServiceDeploymentCause(environmentName, service.Tags.deployment_id, instanceId),
        LogLink: '/deployments/nodes/logs?account=' + accountName + '&environment=' +
          environmentName + '&deploymentId=' + service.Tags.deployment_id + '&node=' + instanceId,
        OverallHealth: getInstanceServiceOverallHealth(instanceServiceHealthChecks),
        HealthChecks: instanceServiceHealthChecks,
        Issues: { Warnings: [], Errors: [] },
      };
    }));
    // If undefined, it's not EM deployed service        
    services = _.filter(services, service => service.DeploymentId !== undefined);

    return {
      OverallHealth: getOverallHealth(checks),
      Services: services,
    };
  });
}