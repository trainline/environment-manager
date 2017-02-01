/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Environment = require('models/Environment');
let Service = require('models/Service');

let fp = require('lodash/fp');

let param = p => fp.get(['swagger', 'params', p, 'value']);

function getRules(request) {
  let resource = request.url.replace(/\/+$/, '');
  let access = request.method;
  let environment = param('environment')(request);
  let service = param('service')(request);

  if (environment !== undefined) {
    return Environment.getByName(environment).then(env => ({
      resource,
      access,
      clusters: [env.OwningCluster],
      environmentTypes: [env.EnvironmentType] }));
  } else {
    return Service.getByName(service).then(svc => ({
      resource,
      access,
      clusters: [svc.OwningCluster] }));
  }
}

module.exports = {
  docs: {
    requiresClusterPermissions: true,
    requiresEnvironmentTypePermissions: true
  },
  getRules
};
