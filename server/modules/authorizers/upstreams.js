/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('config');

function getUpstream(accountName, upstreamName, user) {
  let sender = require('modules/sender');

  let query = {
    name: 'GetDynamoResource',
    key: upstreamName,
    resource: 'config/lbupstream',
    accountName,
  };

  return sender.sendQuery({ query, user });
}

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

function getEnvironmentPermissionsPromise(request) {
  let user = request.user;
  if (request.method === 'POST') {
    return getModifyPermissionsForEnvironment(request.body.Value.EnvironmentName, user);
  }

  let upstreamName = request.params.key;
  let accountName = request.params.account;

  return getUpstream(accountName, upstreamName, request.user)
  .then((upstream) => {
    if (upstream) {
      let environmentName = upstream.Value.EnvironmentName;
      return getModifyPermissionsForEnvironment(environmentName, user);
    }

    throw `Could not find upstream: ${upstreamName}`;
  });
}

exports.getRules = (request) => {
  let r = /^\/(.*)\/config$/;
  let match = r.exec(request.params.key);
  let path = `/${request.params.account}/config/lbUpstream/${match[1]}`;
  let getEnvironmentPermissions = getEnvironmentPermissionsPromise(request);

  return getEnvironmentPermissions.then((envPermissions) => {
    return [{
      resource: path,
      access: request.method,
      clusters: [envPermissions.cluster],
      environmentTypes: [envPermissions.environmentType],
    }];
  });
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: true,
};
