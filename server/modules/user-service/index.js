/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('config');

let implementation;

if (config.get('IS_PRODUCTION')) {
  implementation = new (require('./userService.prod'))();
} else {
  implementation = require('./userService.mock');
}

module.exports = implementation;
