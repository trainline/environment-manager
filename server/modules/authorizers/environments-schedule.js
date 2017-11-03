/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let configEnvironments = require('../data-access/configEnvironments');
let environmentProtection = require('./environmentProtection');

const ACTION = environmentProtection.SCHEDULE_ENVIRONMENT;

function getCurrentEnvironment(name) {
  return configEnvironments.get({ EnvironmentName: name });
}

function* getRules(request) {
  let requiredPermission = {
    resource: request.url.replace(/\/+$/, ''),
    access: request.method
  };

  // Need to check 'name' because of swagger
  let environmentName = request.params.key || request.params.name;
  let user = request.user;
  let environment = yield getCurrentEnvironment(environmentName, user);
  let environmentTypeName = environment.Value.EnvironmentType.toLowerCase();
  if (environment) {
    requiredPermission.clusters = [environment.Value.OwningCluster.toLowerCase()];
    requiredPermission.environmentTypes = [environmentTypeName];
  }

  let isProtected = yield environmentProtection.isActionProtected(environmentName, ACTION);
  if (isProtected) {
    requiredPermission.protectedAction = ACTION;
  }

  return [requiredPermission];
}

module.exports = {
  getRules: co.wrap(getRules),
  docs: {
    requiresClusterPermissions: true,
    requiresEnvironmentTypePermissions: true
  }
};
