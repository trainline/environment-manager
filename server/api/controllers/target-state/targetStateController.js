/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let GetServerRoles = require('queryHandlers/services/GetServerRoles');

let serviceTargets = require('modules/service-targets');

function scanAndDelete({ environmentName, keyPrefix, condition }) {
  return co(function* () {
    let keyValuePairs = yield serviceTargets.getTargetState(environmentName, { key: parameters.keyPrefix, recurse: true });
    let erasedKeys = yield keyValuePairs.filter((keyValuePair) =>
      parameters.condition(keyValuePair.key, keyValuePair.value)
    ).map((keyValuePair) => {
      return serviceTargets.removeTargetState(environmentName, { key: keyValuePair.key }).then(() => keyValuePair.key);
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
  const environmentName = req.swagger.params.environment.value;

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

/**
 * DELETE /target-state/{environment}/{service}
 */
function deleteTargetStateByService(req, res, next) {
  const environmentName = req.swagger.params.environment.value;

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
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const serviceVersion = req.swagger.params.version.value;

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
  getTargetState,
  deleteTargetStateByEnvironment,
  deleteTargetStateByService,
  deleteTargetStateByServiceVersion
};
