/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let config = require('config');
let environmentProtection = require('./environmentProtection');

const ACTION = environmentProtection.SCHEDULE_ENVIRONMENT;

function getCurrentEnvironment(name, user) {
  const masterAccountName = config.getUserValue('masterAccountName');
  let sender = require('modules/sender');

  let query = {
    name: 'GetDynamoResource',
    key: name,
    resource: 'config/environments',
    accountName: masterAccountName,
  };

  return sender.sendQuery({ query, user });
}

function* getRules(request) {
  let requiredPermission = {
    resource: request.url.replace(/\/+$/, ''),
    access: request.method,
  };

  let environmentName = request.params.key;
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
    requiresEnvironmentTypePermissions: true,
  },
};
