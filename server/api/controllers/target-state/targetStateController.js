/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let GetServerRoles = require('queryHandlers/services/GetServerRoles');

function scanAndDelete(environment, parameters) {
  return co(function* () {
    let keyValuePairs = yield serviceTargets.getTargetState(query.environment, { key: parameters.keyPrefix, recurse: true });
    let erasedKeys = yield keyValuePairs.filter((keyValuePair) =>
      parameters.condition(keyValuePair.key, keyValuePair.value)
    ).map((keyValuePair) => {
      return serviceTargets.removeTargetState(environment, { key: keyValuePair.key }).then(() => keyValuePair.key);
    });

    return erasedKeys;
  });
}

/**
 * GET /target-state/{environment}
 */
function getTargetState(req, res, next) {
  const environmentName = req.swagger.params.environment.value;

  GetServerRoles({ environmentName }).then(data => res.json(data)).catch(next);
}

/**
 * DELETE /target-state/{environment}
 */
function deleteTargetStateByEnvironment(req, res, next) {
  throw new Error('not implemented');
  return co(function* () {
    let erasedServicesKeys = yield scanAndDelete({
      keyPrefix: `environments/${environmentName}/services/`,
      condition: () => true,
    });

    let erasedRolesKeys = yield scanAndDelete({
      keyPrefix: `environments/${environmentName}/roles/`,
      condition: () => true,
    });

    return erasedServicesKeys.concat(erasedRolesKeys);
  });
}

/**
 * DELETE /target-state/{environment}/{service}
 */
function deleteTargetStateByService(req, res, next) {
  throw new Error('not implemented');
  return co(function*() {
    let erasedServicesKeys = yield scanAndDelete({
      keyPrefix: `environments/${environmentName}/services/${serviceName}/`,
      condition: () => true
    });

    let erasedRolesKeys = yield scanAndDelete({
      keyPrefix: `environments/${environmentName}/roles/`,
      condition: (key) =>
        key.match(`environments\/.*\/roles\/.*\/services\/${serviceName}\/`)
    });

    return erasedServicesKeys.concat(erasedRolesKeys);
  });
}

/**
 * DELETE /target-state/{environment}/{service}/{version}
 */
function deleteTargetStateByServiceVersion(req, res) {
  throw new Error('not implemented');
  return co(function* () {
    let erasedServicesKeys = yield scanAndDelete({
      keyPrefix: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/`,
      condition: () => true,
    });

    let erasedRolesKeys = yield scanAndDelete({
      keyPrefix: `environments/${environmentName}/roles/`,
      condition: (key, value) =>
        value ? value.Name === serviceName && value.Version === serviceVersion : false,
    });

    return erasedServicesKeys.concat(erasedRolesKeys);
  });
}

module.exports = {
  getTargetState,
  deleteTargetStateByEnvironment,
  deleteTargetStateByService,
  deleteTargetStateByServiceVersion
};
