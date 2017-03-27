/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let configEnvironments = require('modules/data-access/configEnvironments');
let configEnvironmentTypes = require('modules/data-access/configEnvironmentTypes');
let ConfigurationError = require('modules/errors/ConfigurationError.class');
let DynamoItemNotFoundError = require('modules/errors/DynamoItemNotFoundError.class');

function getEnvironmentByName(environmentName) {
  return configEnvironments.get({ EnvironmentName: environmentName })
    .then(
    environment => Promise.resolve(environment.Value),
    error => Promise.reject(error instanceof DynamoItemNotFoundError ?
      new ConfigurationError(`Environment "${environmentName}" not found.`) :
      new Error(`An error has occurred retrieving "${environmentName}" environment: ${error.message}`)
    ));
}

function getEnvironmentTypeByName(environmentTypeName) {
  return configEnvironmentTypes.get({ EnvironmentType: environmentTypeName })
    .then(
    environmentType => Promise.resolve(environmentType.Value),
    error => Promise.reject(error instanceof DynamoItemNotFoundError ?
      new ConfigurationError(`Environment type "${environmentTypeName}" not found.`) :
      new Error(`An error has occurred retrieving "${environmentTypeName}" environment type: ${error.message}`)
    ));
}

module.exports = {
  getEnvironmentByName,
  getEnvironmentTypeByName
};
