/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let sender = require('../sender');
let GetSlicesByService = require('../../queryHandlers/slices/GetSlicesByService');

function getSlicesByService(serviceName, environmentName, accountName, user) {
  return new Promise((resolve, reject) => {
    let query = {
      name: 'GetSlicesByService',
      accountName,
      serviceName,
      environmentName
    };

    sender.sendQuery(GetSlicesByService, { query, user }, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

function getModifyPermissions(serviceName, environmentName, accountName, user) {
  return getSlicesByService(serviceName, environmentName, accountName, user).then((slices) => {
    if (slices && slices.length) {
      let slice = slices[0];
      return slice.OwningCluster.toLowerCase();
    }

    throw new Error(`Could not find environment: ${environmentName}`);
  });
}

// eslint-disable-next-line arrow-body-style
exports.getRules = (request) => {
  return getModifyPermissions(request.params.service, request.params.environment, request.params.account, request.user).then(sliceCluster => (
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
