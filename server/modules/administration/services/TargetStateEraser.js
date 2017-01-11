/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let sender = require('modules/sender');
let systemUser = require('modules/systemUser');

// TODO: Create KVSE Singleton as no configuration changes

function TargetStateEraser(environmentName) {
  this.scanAndDelete = function (parameters) {
    return co(function* () {
      let keyValuePairs = yield getTargetState(parameters.keyPrefix);
      let erasedKeys = yield keyValuePairs.filter(keyValuePair =>
        parameters.condition(keyValuePair.key, keyValuePair.value)
      ).map(keyValuePair =>
        deleteTargetState(keyValuePair.key).then(() =>
          Promise.resolve(keyValuePair.key)
        )
      );

      return erasedKeys;
    });
  };

  function getTargetState(key) {
    let query = {
      name: 'GetTargetState',
      environment: environmentName,
      recurse: true,
      key
    };

    return sender.sendQuery({ query });
  }

  function deleteTargetState(key) {
    let command = {
      name: 'DeleteTargetState',
      environment: environmentName,
      key
    };

    return sender.sendCommand({ command, user: systemUser });
  }
}

module.exports = TargetStateEraser;
