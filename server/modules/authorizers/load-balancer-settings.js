/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

﻿let _ = require('lodash');
let config = require('config');


function getEnvironment(name, user) {
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

function getModifyPermissionsForEnvironment(environmentName, user) {
  return getEnvironment(environmentName, user).then((environment) => {
    if (environment) {
      return {
        cluster: environment.Value.OwningCluster.toLowerCase(),
        environmentType: environment.Value.EnvironmentType.toLowerCase(),
      };
    }

    throw `Could not find environment: ${environmentName}`;
  });
}

// eslint-disable-next-line arrow-body-style
exports.getRules = (request) => {
  return getModifyPermissionsForEnvironment(request.params.key, request.user).then((envPermissions) => (
    [{
      resource: request.url.replace(/\/+$/, ''),
      access: request.method,
      clusters: [envPermissions.cluster],
      environmentTypes: [envPermissions.environmentType],
    }]
  ));
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: true,
};
