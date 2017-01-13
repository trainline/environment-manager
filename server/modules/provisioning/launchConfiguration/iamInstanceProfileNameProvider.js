/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let ConfigurationError = require('modules/errors/ConfigurationError.class');
let sender = require('modules/sender');

module.exports = {
  get(configuration, accountName) {
    assert(configuration, 'Expected "configuration" argument not to be null');
    assert(accountName, 'Expected "accountName" argument not to be null');

    let customInstanceProfileName = configuration.serverRole.InstanceProfileName;
    if (customInstanceProfileName) {
      return getInstanceProfileByName(customInstanceProfileName, accountName)
        .then(
          instanceProfile => Promise.resolve(instanceProfile.InstanceProfileName),
          error => Promise.reject(new ConfigurationError(
            `An error has occurred verifying "${customInstanceProfileName}" instance profile specified in configuration.`,
            error))
        );
    } else {
      let instanceProfileName = getInstanceProfileNameByConvention(configuration);
      return getInstanceProfileByName(instanceProfileName, accountName)
        .then(
          instanceProfile => Promise.resolve(instanceProfile.InstanceProfileName),
          error => Promise.reject(new ConfigurationError(
            `An error has occurred verifying "${instanceProfileName}" instance profile defined by convention. ` +
            'If needed a different one can be specified in configuration.',
            error))
        );
    }
  }
};

function getInstanceProfileNameByConvention(configuration) {
  let serverRoleName = configuration.serverRole.ServerRoleName;
  let clusterName = configuration.cluster.Name;
  let instanceProfileName = `role${clusterName}${serverRoleName}`;

  return instanceProfileName;
}

function getInstanceProfileByName(instanceProfileName, accountName) {
  let query = {
    name: 'GetInstanceProfile',
    accountName,
    instanceProfileName
  };

  return sender.sendQuery({ query });
}
