/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let config = require('config');

let implementation;

if (config.get('IS_PRODUCTION') && !config.get('USE_HTTP')) {
  implementation = new (require('./HttpsServerFactory'))();
} else {
  implementation = new (require('./HttpServerFactory'))();
}

module.exports = implementation;
