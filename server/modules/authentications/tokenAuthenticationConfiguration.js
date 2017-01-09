/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let config = require('config');

function loadConfiguration() {
  let localConfig = config.getUserValue('local');

  assert(localConfig.authentication, 'missing \'authentication\' field in configuration');
  assert(localConfig.authentication.tokenDuration, 'missing \'authentication.tokenDuration\' field in configuration');

  return {
    tokenDuration: localConfig.authentication.tokenDuration,
  };
}

module.exports = {
  getTokenDuration: () => {
    let configuration = loadConfiguration();
    return configuration.tokenDuration;
  },
};
