/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let BadRequestError = require('modules/errors/BadRequestError.class');

let infrastructureConfigurationProvider = require('modules/provisioning/infrastructureConfigurationProvider');
let logger = require('modules/logger');
let Environment = require('models/Environment');
let co = require('co');

// Only deployments targeted to Secure subnet in Production require an additional permission
function isSecureServerRole(configuration) {
  if (configuration.serverRole.SecurityZone === 'Secure') return true;
  return false;
}

module.exports = {
  getRules(request) {
    return co(function* () {
      // TODO(filip): clean these when dropping old API (switching to v1)
      let environmentName = request.params.environment || request.body.environment;
      let serviceName = request.params.service || request.body.service;

      // TODO(filip): move this to middleware before authorizer and share result with route handler
      let environment = yield Environment.getByName(environmentName);
      let deploymentMap = yield environment.getDeploymentMap();
      let serverRoles = _.map(yield deploymentMap.getServerRolesByServiceName(serviceName), 'ServerRoleName');

      let serverRoleName;
      let inputServerRole = request.query.server_role || request.body.server_role || request.body.serverRole;
      if (inputServerRole) {
        serverRoleName = inputServerRole;
        if (serverRoles.indexOf(serverRoleName) === -1) {
          return Promise.reject(new BadRequestError(`"${serverRoleName}" is not a potential target for deploy of "${serviceName}", available roles: ${serverRoles.join(', ')}`));
        }
      } else if (serverRoles.length !== 1) {
        return Promise.reject(new BadRequestError(`"server_role" param required, available server roles for "${serviceName}": ${serverRoles.join(', ')}`));
      } else {
        serverRoleName = serverRoles[0];
      }

      // Attach serverRoles to request object
      request.serverRoleName = serverRoleName;

      let requiredPermissions = [];
      let requiredPermission = {
        resource: request.url.replace(/\/+$/, ''),
        access: request.method,
        clusters: [],
        environmentTypes: [],
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
              access: 'POST',
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
    requiresSecurityZonePermissions: true,
  },
};
