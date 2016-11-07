/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let config = require('config');
let co = require('co');
let Environment = require('models/Environment');
let logger = require('modules/logger');

function getUpstream(accountName, upstreamName) {
  let sender = require('modules/sender');

  let query = {
    name: 'GetDynamoResource',
    key: upstreamName,
    resource: 'config/lbupstream',
    accountName
  };

  return sender.sendQuery({ query });
}

function getEnvironment(name) {
  const masterAccountName = config.getUserValue('masterAccountName');
  let sender = require('modules/sender');
  let query = {
    name: 'GetDynamoResource',
    key: name,
    resource: 'config/environments',
    accountName: masterAccountName,
  };

  return sender.sendQuery({ query });
}

function getModifyPermissionsForEnvironment(environmentName) {
  return getEnvironment(environmentName).then((environment) => {
    return {
      cluster: environment.Value.OwningCluster.toLowerCase(),
      environmentType: environment.Value.EnvironmentType.toLowerCase()
    };
  });
}

function getEnvironmentPermissionsPromise(upstreamName, environmentName, accountName, method) {
  if (method === 'POST') {
    return getModifyPermissionsForEnvironment(environmentName);
  }

  return getUpstream(accountName, upstreamName)
    .then((upstream) => {

      if (upstream) {
        let environmentName = upstream.Value.EnvironmentName;
        return getModifyPermissionsForEnvironment(environmentName);
      }

      throw `Could not find upstream: ${upstreamName}`;
    });
}

exports.getRules = (request) => {
  let r = /^\/(.*)\/config$/;
  // TODO(Filip): remove this after switching all to V1 API
  let upstreamName = request.params.key || request.params.name || request.params.body.key;
  let accountName = request.params.account;

  return co(function* () {
    let body = request.params.body || request.body;
    logger.debug(`Upstreams authorizer`, { body, url: request.url });
    // TODO(Filip): remove this hack after we move all upstreams data into one account
    let environmentName = upstreamName.substr(1, upstreamName.indexOf('_'));
    console.log(environmentName);
    
    if (accountName === undefined) {
      accountName = yield Environment.getAccountNameForEnvironment(environmentName);
    }

    let match = r.exec(upstreamName);
    let path = `/${request.params.account}/config/lbUpstream/${match[1]}`;
    let getEnvironmentPermissions = getEnvironmentPermissionsPromise(upstreamName, environmentName, accountName, request.method);

    return getEnvironmentPermissions.then(envPermissions => {
      return [{
        resource: path,
        access: request.method,
        clusters: [ envPermissions.cluster ],
        environmentTypes: [ envPermissions.environmentType ]
      }];
    });

  });
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: true,
};
