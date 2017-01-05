/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let config = require('config');
const modulePath = config.get('IS_PRODUCTION') ?
  './activeDirectoryAdapter.prod.js' :
  './activeDirectoryAdapter.mock.js';

let Implementation = require(modulePath);

module.exports = new Implementation();
