/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('../../config');
const mock = require('./sslComponentsRepository.mock.js');
const prod = require('./sslComponentsRepository.prod.js');

let implementation;

if (config.get('IS_PRODUCTION')) {
  implementation = prod;
} else {
  implementation = mock;
}

module.exports = implementation;
