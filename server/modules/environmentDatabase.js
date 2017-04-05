/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let configEnvironments = require('modules/data-access/configEnvironments');
let configEnvironmentTypes = require('modules/data-access/configEnvironmentTypes');
let ConfigurationError = require('modules/errors/ConfigurationError.class');

function getEnvironmentByName(environmentName) {
  return configEnvironments.get({ EnvironmentName: environmentName })
    .then((environment) => {
      if (environment) {
        return Promise.resolve(environment.Value);
      } else {
        return Promise.reject(new ConfigurationError(`Environment "${environmentName}" not found.`));
      }
    });
}

function getEnvironmentTypeByName(environmentTypeName) {
  return configEnvironmentTypes.get({ EnvironmentType: environmentTypeName })
    .then((environment) => {
      if (environment) {
        return Promise.resolve(environment.Value);
      } else {
        return Promise.reject(new ConfigurationError(`Environment type "${environmentTypeName}" not found.`));
      }
    });
}

module.exports = {
  getEnvironmentByName,
  getEnvironmentTypeByName
};
