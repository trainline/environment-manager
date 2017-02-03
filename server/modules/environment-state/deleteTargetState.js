/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let assert = require('assert');
let serviceTargets = require('modules/service-targets');

function scanAndDelete({ environmentName, keyPrefix, condition }) {
  return co(function* () {
    let keyValuePairs = yield serviceTargets.getTargetState(environmentName, { key: keyPrefix, recurse: true });
    let erasedKeys = yield keyValuePairs.filter((keyValuePair) =>
      condition(keyValuePair.key, keyValuePair.value)
    ).map((keyValuePair) => {
      return serviceTargets.removeTargetState(environmentName, { key: keyValuePair.key }).then(() => keyValuePair.key);
    });

    return erasedKeys;
  });
}

function byEnvironment({ environmentName }) {
  assert(environmentName);
  return co(function* () {
    let erasedServicesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/services/`,
      condition: () => true,
    });

    let erasedRolesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/roles/`,
      condition: () => true,
    });

    return erasedServicesKeys.concat(erasedRolesKeys);
  });
}

function byService({ environmentName, serviceName }) {
  assert(environmentName);
  assert(serviceName);
  return co(function* () {
    let erasedServicesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/services/${serviceName}/`,
      condition: () => true
    });

    let erasedRolesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/roles/`,
      condition: (key) =>
        key.match(`environments\/.*\/roles\/.*\/services\/${serviceName}\/`)
    });

    return erasedServicesKeys.concat(erasedRolesKeys);
  });
}

function byServiceVersion({ environmentName, serviceName, serviceVersion }) {
  assert(environmentName);
  assert(serviceName);
  assert(serviceVersion);
  return co(function* () {
    let erasedServicesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/`,
      condition: () => true,
    });

    let erasedRolesKeys = yield scanAndDelete({
      environmentName,
      keyPrefix: `environments/${environmentName}/roles/`,
      condition: (key, value) =>
        value ? value.Name === serviceName && value.Version === serviceVersion : false,
    });

    return erasedServicesKeys.concat(erasedRolesKeys);
  });
}

module.exports = {
  byEnvironment,
  byService,
  byServiceVersion
};