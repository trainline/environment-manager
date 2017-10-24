/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function getSlicesByUpstream(upstreamName, environmentName, accountName, user) {
  return new Promise((resolve, reject) => {
    let sender = require('../sender');

    let query = {
      name: 'GetSlicesByUpstream',
      accountName,
      upstreamName,
      environmentName
    };

    sender.sendQuery({ query, user }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function getModifyPermissions(upstreamName, environmentName, accountName, user) {
  return getSlicesByUpstream(upstreamName, environmentName, accountName, user).then((slices) => {
    if (slices && slices.length) {
      let slice = slices[0];
      return slice.OwningCluster.toLowerCase();
    }

    throw new Error(`Could not find environment: ${environmentName}`);
  });
}

// eslint-disable-next-line arrow-body-style
exports.getRules = (request) => {
  return getModifyPermissions(request.params.upstream, request.params.environment, request.params.account, request.user).then(sliceCluster => (
    [{
      resource: request.url.replace(/\/+$/, ''),
      access: request.method,
      clusters: [sliceCluster]
    }]
  ));
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: false
};
