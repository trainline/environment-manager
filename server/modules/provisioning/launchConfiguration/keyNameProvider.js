/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let sender = require('modules/sender');

let ConfigurationError = require('modules/errors/ConfigurationError.class');

module.exports = {
  get: function (configuration, accountName) {
    assert(configuration, 'Expected "configuration" argument not to be null');
    assert(accountName, 'Expected "accountName" argument not to be null');

    var customKeyName = configuration.serverRole.ClusterKeyName;
    if (customKeyName) {
      return getKeyPairByName(customKeyName, accountName)
        .then(
          keyPair => Promise.resolve(keyPair.KeyName),
          error => Promise.reject(new ConfigurationError(
            `An error has occurred verifying "${customKeyName}" key pair specified in configuration.`,
            error))
        );
    } else {
      var keyName = configuration.cluster.KeyPair;

      return getKeyPairByName(keyName, accountName)
        .then(
          keyPair => Promise.resolve(keyPair.KeyName),
          error => Promise.reject(new ConfigurationError(
            `An error has occurred verifying "${keyName}" key pair defined by convention. ` +
            `If needed a different one can be specified in configuration.`,
            error))
        );
    }
  },
};

function getKeyPairByName(keyName, accountName) {
  var query = {
    name: 'GetKeyPair',
    accountName: accountName,
    keyName: keyName,
  };

  return sender.sendQuery({ query: query });
}
