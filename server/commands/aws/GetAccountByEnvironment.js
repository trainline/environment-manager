/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let configCache = require('modules/configurationCache');

/**
 * Attempts to map a given environment name to the internal AWS account name
 * to which it belongs.
 *
 * @param command {{environment:string}} Command object containing the name of the environment
 * @returns {Promise} Resolves the account or rejects with failure reason
 */
function getAccountByEnvironment(command) {
  let getEnvType = env => env.EnvironmentType;
  let getAccountName = envType => envType.AWSAccountName;

  return configCache
    .getEnvironmentByName(command.environment)
    .then(getEnvType)
    .then(configCache.getEnvironmentTypeByName)
    .then(getAccountName)
    .catch((e) => { throw new Error(getErrorMsg(command, e)); });
}

/**
 * Convert a generic exception to an API specific error message.
 *
 * @param command {{environment:string}} The original command object
 * @param error {Error} The exception that was caught
 * @returns {String} The API specific error description
 */
function getErrorMsg(command, error) {
  switch (error.message.substring(22, error.message.length - 9)) {
    case 'EnvironmentType': return `Could not find environment ${command.environment}`; break;
    case 'AWSAccountName': return `Could not find environment type for ${command.environment}`; break;
    default: return error.message;
  }
}

module.exports = getAccountByEnvironment;
