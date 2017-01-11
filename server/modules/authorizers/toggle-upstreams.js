/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');

function getSlicesByUpstream(upstreamName, environmentName, accountName, user) {

  return new Promise((resolve, reject) => {

    var sender = require('modules/sender');

    var query = {
      name: 'GetSlicesByUpstream',
      accountName: accountName,
      upstreamName: upstreamName,
      environmentName: environmentName
    };

    sender.sendQuery({ query: query, user: user }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });

  });

}

function getModifyPermissions(upstreamName, environmentName, accountName, user) {

  return getSlicesByUpstream(upstreamName, environmentName, accountName, user).then(slices => {

    if (slices && slices.length) {
      var slice = slices[0];
      return slice.OwningCluster.toLowerCase();
    }

    throw `Could not find environment: ${environmentName}`;

  });

}

exports.getRules = request => {

  return getModifyPermissions(request.params.upstream, request.params.environment, request.params.account, request.user).then(sliceCluster => {
    return [{
      resource: request.url.replace(/\/+$/, ''),
      access: request.method,
      clusters: [sliceCluster]
    }];
  });

};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: false
};