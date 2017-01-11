/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('config');
let consul = require('consul');
let clientConfig;

if (config.get('IS_PRODUCTION')) {
  clientConfig = require('./clientConfig.prod.js');
} else {
  clientConfig = require('./clientConfig.mock.js');
}

function createConfig(options) {
  return clientConfig(options);
}

function create(options) {
  return createConfig(options).then(newConfig => consul(newConfig));
}

module.exports = { createConfig, create };
