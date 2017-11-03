/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let sender = require('../../sender');
let GetKeyPair = require('../../../queryHandlers/GetKeyPair');
let ConfigurationError = require('../../errors/ConfigurationError.class');

module.exports = {
  get(configuration, accountName) {
    assert(configuration, 'Expected "configuration" argument not to be null');
    assert(accountName, 'Expected "accountName" argument not to be null');

    let customKeyName = configuration.serverRole.ClusterKeyName;
    if (customKeyName) {
      return getKeyPairByName(customKeyName, accountName)
        .then(
          keyPair => Promise.resolve(keyPair.KeyName),
          error => Promise.reject(new ConfigurationError(
            `An error has occurred verifying "${customKeyName}" key pair specified in configuration.`,
            error))
        );
    } else {
      let keyName = configuration.cluster.KeyPair;
      if (keyName === '' || keyName === undefined || keyName === null) {
        return Promise.reject(
          new ConfigurationError('Server role EC2 key pair set to cluster EC2 key pair, but this is empty. Please fix your configuration'));
      }

      return getKeyPairByName(keyName, accountName)
        .then(
          keyPair => Promise.resolve(keyPair.KeyName),
          error => Promise.reject(new ConfigurationError(
            `An error has occurred verifying "${keyName}" key pair defined by convention. ` +
            'If needed a different one can be specified in configuration.',
            error))
        );
    }
  }
};

function getKeyPairByName(keyName, accountName) {
  let query = {
    name: 'GetKeyPair',
    accountName,
    keyName
  };

  return sender.sendQuery(GetKeyPair, { query });
}
