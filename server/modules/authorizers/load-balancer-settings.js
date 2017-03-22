/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let configEnvironments = require('modules/data-access/configEnvironments');

function getEnvironment(name, user) {
  return configEnvironments.get({ EnvironmentName: name });
}

function getModifyPermissionsForEnvironment(environmentName, user) {
  return getEnvironment(environmentName, user).then((environment) => {
    if (environment) {
      return {
        cluster: environment.Value.OwningCluster.toLowerCase(),
        environmentType: environment.Value.EnvironmentType.toLowerCase()
      };
    }

    throw new Error(`Could not find environment: ${environmentName}`);
  });
}

exports.getRules = (request) => {
  let environmentName = request.params.key || request.params.environment;
  if (environmentName === undefined) {
    // Environment is in the body
    let body = request.params.body || request.body;
    environmentName = body.EnvironmentName || body.Value.EnvironmentName;
  }
  return getModifyPermissionsForEnvironment(environmentName, request.user).then(envPermissions => [{
    resource: request.url.replace(/\/+$/, ''),
    access: request.method,
    clusters: [envPermissions.cluster],
    environmentTypes: [envPermissions.environmentType]
  }]);
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: true
};
