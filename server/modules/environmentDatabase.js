/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let configEnvironments = require('modules/data-access/configEnvironments');
let ConfigurationError = require('modules/errors/ConfigurationError.class');
let DynamoItemNotFoundError = require('modules/errors/DynamoItemNotFoundError.class');
let sender = require('modules/sender');
let awsAccounts = require('modules/awsAccounts');

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
  return awsAccounts.getMasterAccountName()
    .then((masterAccountName) => {
      let query = {
        name: 'GetDynamoResource',
        resource: 'config/environmenttypes',
        accountName: masterAccountName,
        key: environmentTypeName
      };

      return sender
        .sendQuery({ query })
        .then(
        environmentType => Promise.resolve(environmentType.Value),
        error => Promise.reject(error instanceof DynamoItemNotFoundError ?
          new ConfigurationError(`Environment type "${environmentTypeName}" not found.`) :
          new Error(`An error has occurred retrieving "${environmentTypeName}" environment type: ${error.message}`)
        ));
    });
}

module.exports = {
  getEnvironmentByName,
  getEnvironmentTypeByName
};
