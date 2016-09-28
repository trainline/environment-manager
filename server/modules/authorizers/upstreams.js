/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let config = require('config');

function getUpstream(accountName, upstreamName, user) {
  const masterAccountName = config.getUserValue('masterAccountName');
  var sender = require('modules/sender');

  var query = {
    name: 'GetDynamoResource',
    key: upstreamName,
    resource: 'config/lbupstream',
    accountName: accountName
  };

  return sender.sendQuery({ query: query, user: user });
}

function getEnvironment(name, user) {
  const masterAccountName = config.getUserValue('masterAccountName');
  var sender = require('modules/sender');
  var query = {
    name: 'GetDynamoResource',
    key: name,
    resource: 'config/environments',
    accountName: masterAccountName,
  };

  return sender.sendQuery({ query: query, user: user });
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

function getEnvironmentPermissionsPromise(request) {
  var user = request.user;
  if (request.method === 'POST') {
    return getModifyPermissionsForEnvironment(request.body.Value.EnvironmentName, user);
  }

  var upstreamName = request.params.key;
  var accountName = request.params.account;

  return getUpstream(accountName, upstreamName, request.user)
  .then(upstream => {

    if (upstream) {
      var environmentName = upstream.Value.EnvironmentName;
      return getModifyPermissionsForEnvironment(environmentName, user);
    }

    throw `Could not find upstream: ${upstreamName}`;
  });
}

exports.getRules = request => {
  var r = /^\/(.*)\/config$/;
  var match = r.exec(request.params.key);
  var path = `/${request.params.account}/config/lbUpstream/${match[1]}`;
  var getEnvironmentPermissions = getEnvironmentPermissionsPromise(request);

  return getEnvironmentPermissions.then(envPermissions => {
    return [{
      resource: path,
      access: request.method,
      clusters: [envPermissions.cluster],
      environmentTypes: [envPermissions.environmentType]
    }];
  });
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: true,
};
