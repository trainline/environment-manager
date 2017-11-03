/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('../../config');
const Ssl = require('./HttpsServerFactory');
const NoSsl = require('./HttpServerFactory');
let implementation;

if (config.get('IS_PRODUCTION') && !config.get('USE_HTTP')) {
  implementation = new Ssl();
} else {
  implementation = new NoSsl();
}

module.exports = implementation;
