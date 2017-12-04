/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

exports.getRules = (request) => {
  let body = request.params.body || request.body;
  let cluster = request.params.range || request.params.cluster || body.OwningCluster;

  return Promise.resolve([{
    resource: request.url.replace(/\/+$/, ''),
    access: request.method,
    clusters: [cluster.toLowerCase()]
  }]);
};

exports.docs = {
  requiresClusterPermissions: true,
  requiresEnvironmentTypePermissions: false
};
