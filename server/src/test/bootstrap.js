/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let process = require('process');
let config = require('../config');
let localConfig = require('../../configuration.sample');

process.env.EM_PROFILE = 'src/test/test-profile.json';
config.setUserValue('local', localConfig);
