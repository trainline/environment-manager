/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('config');

function getCurrentEnvironment(name, user) {
  const masterAccountName = config.getUserValue('masterAccountName');
  let sender = require('modules/sender');

  let query = {
    name: 'GetDynamoResource',
    key: name,
    resource: 'config/environments',
    accountName: masterAccountName
  };

  return sender.sendQuery({ query, user });
}

exports.getRules = (request) => {
  let requiredPermission = {
    resource: request.url.replace(/\/+$/, ''),
    access: request.method,
    clusters: [],
    environmentTypes: []
  };

  if (request.method === 'POST') {
    let newCluster = request.body.Value.OwningCluster;
    if (newCluster) {
      requiredPermission.clusters.push(newCluster.toLowerCase());
    }

    let environmentType = request.body.Value.EnvironmentType;
    if (environmentType) {
      requiredPermission.environmentTypes.push(environmentType.toLowerCase());
    }

    return Promise.resolve([requiredPermission]);
  }

  if (request.method === 'PUT') {
    // TODO: subsequent parameters are for v1 API.
    // Once old API is gone, should use request.swagger.params.
    let environmentType = request.body.EnvironmentType || request.body.Value.EnvironmentType || request.params.environment;

    if (environmentType) {
      requiredPermission.environmentTypes.push(environmentType.toLowerCase());
    }
  }

  // TODO: subsequent parameters are for v1 API.
  // Once old API is gone, should use request.swagger.params.
  let environmentName = request.params.key || request.params.name || request.params.environment;
  let user = request.user;

  return getCurrentEnvironment(environmentName, user).then((environment) => {
    if (environment) {
      requiredPermission.clusters.push(environment.Value.OwningCluster.toLowerCase());
      requiredPermission.environmentTypes.push(environment.Value.EnvironmentType.toLowerCase());
    }

    return [requiredPermission];
  });
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: true
};
