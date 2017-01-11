/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let utils = require('modules/utilities');
let ResourceNotFoundError = require('modules/errors/ResourceNotFoundError.class');
let HttpRequestError = require('modules/errors/HttpRequestError.class');
let consulClient = require('modules/consul-client');
let logger = require('modules/logger');
let retry = require('retry');
let _ = require('lodash');
let Enums = require('Enums');

function encodeValue(value) {
  if (!value) return null;
  return (typeof value === 'object') ? JSON.stringify(value) : value;
}

function decodeValue(encodedValue) {
  if (!encodedValue) return null;
  let value = utils.safeParseJSON(encodedValue);
  return value || encodedValue;
}

function asKeyValuePair(item) {
  return {
    key: item.Key,
    value: decodeValue(item.Value),
  };
}

function getTargetState(environment, parameters) {
  assert(parameters, 'Expected "parameters" not to be null or empty.');

  let promiseFactoryMethod = () => createConsulClient(environment).then(clientInstance => clientInstance.kv.get({ key: parameters.key, recurse: parameters.recurse }).catch((error) => {
    throw new HttpRequestError(`An error has occurred contacting consul agent: ${error.message}`);
  }).then((result) => {
    if (parameters.recurse) {
      let data = result ? result.map(asKeyValuePair) : [];
      return data;
    }
    if (result) {
      return asKeyValuePair(result);
    }
    throw new ResourceNotFoundError(`Key "${parameters.key}" in Consul key/value storage has not been found.`);
  }));

  return executeAction(promiseFactoryMethod);
}

function getAllServiceTargets(environmentName, runtimeServerRole) {
  assert(runtimeServerRole, 'runTimeServerRole needs to be defined');
  assert(environmentName, 'environmentName needs to be defined');
  let key = `environments/${environmentName}/roles/${runtimeServerRole}/services`;
  return getTargetState(environmentName, { key, recurse: true }).then(data => _.map(data, 'value'))
    .then((data) => {
      // Note: this is for backwards compatibility. Once all server role services have "Action" attribute, we can remove that
      _.each(data, (service) => {
        if (service.Action === undefined) {
          service.Action = 'Install';
        }
      });
      return data;
    });
}

function getInstanceServiceDeploymentInfo(environmentName, deploymentId, instanceId) {
  let key = `deployments/${deploymentId}/nodes/${instanceId}`;
  return getTargetState(environmentName, { key, recurse: true }).then(data => _.get(data, '[0].value'));
}

function getServiceDeploymentCause(environmentName, deploymentId, instanceId) {
  let key = `deployments/${deploymentId}/nodes/${instanceId}`;
  let value = '[0].value.Cause';
  let defaultValue = 'Unknown';

  return getTargetState(environmentName, { key, recurse: true }).then(data => _.get(data, value, defaultValue));
}

function setTargetState(environment, parameters) {
  assert(parameters, 'Expected "parameters" not to be null or empty.');
  let promiseFactoryMethod = () => new Promise((resolve, reject) => {
    createConsulClient(environment).then((clientInstance) => {
      let encodedValue = encodeValue(parameters.value);
      let options = {};

      if (parameters.options) {
        if (parameters.options.expectedVersion !== undefined) {
          options.cas = parameters.options.expectedVersion;
        }
      }
      clientInstance.kv.set(parameters.key, encodedValue, options, (error, created) => {
        if (error) {
          return reject(new HttpRequestError(
            `An error has occurred contacting consul agent: ${error.message}`
          ));
        }
        if (!created) {
          return reject(new Error(
            `Consul '${parameters.key}' key cannot be updated`
          ));
        }
        logChange('SET', parameters.key, encodedValue);
        return resolve();
      });
    });
  });
  return executeAction(promiseFactoryMethod);
}

function removeRuntimeServerRoleTargetState(environmentName, runtimeServerRoleName) {
  return removeTargetState(environmentName, {
    key: `environments/${environmentName}/roles/${runtimeServerRoleName}`,
    recurse: true,
  });
}

function removeTargetState(environment, { key, recurse }) {
  assert(key, 'Expected "key" not to be null or empty.');
  let promiseFactoryMethod = () => new Promise((resolve, reject) => {
    createConsulClient(environment).then((clientInstance) => {
      clientInstance.kv.get({ key, recurse }, (getError, result) => {
        clientInstance.kv.del({ key, recurse }, (delError) => {
          if (!delError) {
            logChange('DELETE', key, result);
            return resolve();
          }
          return reject(new HttpRequestError(
            `An error has occurred contacting consul agent: ${delError.message}`
          ));
        });
      });
    });
  });

  return executeAction(promiseFactoryMethod);
}

function executeAction(promiseFactoryMethod) {
  let operation = retry.operation({
    retries: 3,
    minTimeout: 1000,
  });

  return new Promise((resolve, reject) => {
    operation.attempt(() => {
      promiseFactoryMethod()
        .then(result => resolve(result))
        .catch((error) => {
          if ((error instanceof HttpRequestError) && operation.retry(error)) return;
          reject(error);
        });
    });
  });
}

function createConsulClient(environment) {
  return consulClient.create({ environment, promisify: true });
}

function logChange(operation, key, value) {
  logger.debug(`Consul key value store operation: ${operation} ${key}. ${value}`);
}

module.exports = {
  getTargetState,
  setTargetState,
  removeTargetState,
  removeRuntimeServerRoleTargetState,
  getAllServiceTargets,
  getServiceDeploymentCause,
  getInstanceServiceDeploymentInfo,
};
