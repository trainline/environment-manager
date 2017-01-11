/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

﻿let _ = require('lodash');
let config = require('config');


function getEnvironment(name, user) {
  const masterAccountName = config.getUserValue('masterAccountName');
  var sender = require('modules/sender');

  var query = {
    name: 'GetDynamoResource',
    key: name,
    resource: 'config/environments',
    accountName: masterAccountName,
  };

  return sender.sendQuery({ query, user });
}

function getModifyPermissionsForEnvironment(environmentName, user) {
  return getEnvironment(environmentName, user).then(environment => {
    if (environment) {
      return {
        cluster: environment.Value.OwningCluster.toLowerCase(),
        environmentType: environment.Value.EnvironmentType.toLowerCase()
      };
    }

    throw `Could not find environment: ${environmentName}`;
  });
}

exports.getRules = (request) => {
  // TODO(Filip): simplify after removing old API
  let environmentName = request.params.key || request.params.environment;
  if (environmentName === undefined) {
    // Environment is in the body
    let body = request.params.body || request.body;
    environmentName = body.EnvironmentName || body.Value.EnvironmentName
  }
  return getModifyPermissionsForEnvironment(environmentName, request.user).then(envPermissions => {
    return [{
      resource: request.url.replace(/\/+$/, ''),
      access: request.method,
      clusters: [envPermissions.cluster],
      environmentTypes: [envPermissions.environmentType]
    }];
  });
};

exports.docs = {
    requiresClusterPermissions: true,
    requiresEnvironmentTypePermissions: true
};
