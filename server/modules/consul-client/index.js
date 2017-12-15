/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('../../config');
let consul = require('consul');
let mock = require('./clientConfig.mock.js');
let prod = require('./clientConfig.prod.js');

let clientConfig = config.get('IS_PRODUCTION') ? prod : mock;

function createConfig(options) {
  return clientConfig(options);
}

function create(options) {
  return createConfig(options).then(newConfig => consul(newConfig));
}

module.exports = { createConfig, create };
