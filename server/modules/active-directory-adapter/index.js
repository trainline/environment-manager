/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('../../config');
const mock = require('./activeDirectoryAdapter.mock.js');
const prod = require('./activeDirectoryAdapter.prod.js');

let Implementation = config.get('IS_PRODUCTION') ? prod : mock;

module.exports = new Implementation();
