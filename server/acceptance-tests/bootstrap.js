/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

require('..');

var path = require('path');
var config = require('../config');

console.log('============= TEST CONFIG =============');
console.log('EM_AWS_REGION: ' + config.get('EM_AWS_REGION'));
console.log('EM_AWS_RESOURCE_PREFIX: ' + config.get('EM_AWS_RESOURCE_PREFIX'));
console.log('=======================================');