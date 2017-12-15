/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('../config');
let localConfig = require('../configuration.sample');

config.setUserValue('local', localConfig);
