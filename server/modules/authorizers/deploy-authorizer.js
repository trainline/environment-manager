/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let BadRequestError = require('modules/errors/BadRequestError.class');

let infrastructureConfigurationProvider = require('modules/provisioning/infrastructureConfigurationProvider');
let logger = require('modules/logger');
let Environment = require('models/Environment');
let resolveDeploymentDestination = require('modules/deployment/resolveDeploymentDestination');
let deploymentMaps = require('modules/data-access/deploymentMaps');
let co = require('co');

// Only deployments targeted to Secure subnet in Production require an additional permission
function isSecureServerRole(configuration) {
  if (configuration.serverRole.SecurityZone === 'Secure') return true;
  return false;
}

module.exports = {
  getRules(request) {
    return co(function* () {
      let environmentName = request.params.environment || request.body.environment;
      let serviceName = request.params.service || request.body.service;
      let serverRole = request.body.serverRole;
      let environment = yield Environment.getByName(environmentName);
      let deploymentMap = yield deploymentMaps.get({ DeploymentMapName: environment.DeploymentMap });

      let serverRoleName = resolveDeploymentDestination(deploymentMap, { serverRole, service: serviceName });

      let requiredPermissions = [];
      let requiredPermission = {
        resource: request.url.replace(/\/+$/, ''),
        access: request.method,
        clusters: [],
        environmentTypes: []
      };
      requiredPermissions.push(requiredPermission);

      return infrastructureConfigurationProvider
        .get(environmentName, serviceName, serverRoleName)
        .then((configuration) => {
          requiredPermission.clusters.push(configuration.cluster.Name.toLowerCase());

          requiredPermission.environmentTypes.push(configuration.environmentTypeName.toLowerCase());

          if (isSecureServerRole(configuration)) {
            requiredPermissions.push({
              resource: '/permissions/securityzones/secure',
              access: 'POST'
            });
          }

          return requiredPermissions;
        }).catch((error) => {
          logger.warn(error.toString(true));
          return Promise.reject(new BadRequestError(error.toString()));
        });
    });
  },

  docs: {
    requiresClusterPermissions: true,
    requiresEnvironmentTypePermissions: true,
    requiresSecurityZonePermissions: true
  }
};
