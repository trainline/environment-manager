/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let GetServerRoles = require('queryHandlers/services/GetServerRoles');
let deleteTargetState = require('modules/environment-state/deleteTargetState');
const sns = require('modules/sns/EnvironmentManagerEvents');

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

  deleteTargetState.byEnvironment({ environmentName })
    .then(data => res.json(data))
    .then(sns.publish({
      message: `DELETE /target-state/${environmentName}`,
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: environmentName,
        EnvironmentName: environmentName
      }
    }))
    .catch(next);
}

/**
 * DELETE /target-state/{environment}/{service}
 */
function deleteTargetStateByService(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;

  deleteTargetState.byService({ environmentName, serviceName })
    .then(data => res.json(data))
    .then(sns.publish({
      message: `DELETE /target-state/${environmentName}/${serviceName}`,
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: `${environmentName}/${serviceName}`,
        EnvironmentName: environmentName
      }
    }))
    .catch(next);
}

/**
 * DELETE /target-state/{environment}/{service}/{version}
 */
function deleteTargetStateByServiceVersion(req, res, next) {
  const environmentName = req.swagger.params.environment.value;
  const serviceName = req.swagger.params.service.value;
  const serviceVersion = req.swagger.params.version.value;

  deleteTargetState.byServiceVersion({ environmentName, serviceName, serviceVersion })
    .then(data => res.json(data))
    .then(sns.publish({
      message: `DELETE /target-state/${environmentName}/${serviceName}/${serviceVersion}`,
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        EnvironmentName: environmentName,
        ID: `${environmentName}/${serviceName}/${serviceVersion}`
      }
    }))
    .catch(next);
}

module.exports = {
  getTargetState,
  deleteTargetStateByEnvironment,
  deleteTargetStateByService,
  deleteTargetStateByServiceVersion
};
