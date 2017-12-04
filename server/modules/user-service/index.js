/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('../../config');
const mock = require('./userService.mock');
const Prod = require('./userService.prod');
let implementation;

if (config.get('IS_PRODUCTION')) {
  implementation = new Prod();
} else {
  implementation = mock;
}

module.exports = implementation;
