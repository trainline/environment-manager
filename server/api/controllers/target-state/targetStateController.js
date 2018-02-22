/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let GetServerRoles = require('../../../queryHandlers/services/GetServerRoles');
let deleteTargetState = require('../../../modules/environment-state/deleteTargetState');
const { toggleServiceStatus } = require('../../../modules/toggleServiceStatus');
const sns = require('../../../modules/sns/EnvironmentManagerEvents');

/**
 * GET /target-state/{environment}
 */
function getTargetState(req, res, next) {
  const environmentName = req.swagger.params.environment.value;

  GetServerRoles({ environmentName })
    .then(data => res.json(data))
    .catch(next);
}

/**
 * DELETE /target-state/{environment}
 */
function deleteTargetStateByEnvironment(req, res, next) {
  const environmentName = req.swagger.params.environment.value;

  deleteTargetState.byEnvironment({ environmentName })
    .then(data => res.json(data))
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/target-state/${environmentName}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: environmentName,
        Environment: environmentName
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
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/target-state/${environmentName}/${serviceName}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        ID: `${environmentName}/${serviceName}`,
        Environment: environmentName
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
    .then(() => sns.publish({
      message: JSON.stringify({
        Endpoint: {
          Url: `/target-state/${environmentName}/${serviceName}/${serviceVersion}`,
          Method: 'DELETE'
        }
      }),
      topic: sns.TOPICS.OPERATIONS_CHANGE,
      attributes: {
        Action: sns.ACTIONS.DELETE,
        Environment: environmentName,
        ID: `${environmentName}/${serviceName}/${serviceVersion}`
      }
    }))
    .catch(next);
}

/**
 * PUT /target-state/{environment}/{service}/toggle-status
 */
function toggleServiceStatusHandler(req, res, next) {
  const environment = req.swagger.params.environment.value;
  const service = req.swagger.params.service.value;
  const body = req.swagger.params.body.value;
  const enable = body.Enable;
  const slice = body.Slice;
  const serverRole = body.ServerRole;
  const user = req.user;

  toggleServiceStatus({ environment, service, slice, enable, serverRole, user })
    .then((data) => { res.json(data); })
    .catch(next);
}

module.exports = {
  getTargetState,
  deleteTargetStateByEnvironment,
  deleteTargetStateByService,
  deleteTargetStateByServiceVersion,
  toggleServiceStatusHandler
};
