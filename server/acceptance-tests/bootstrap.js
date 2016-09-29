"use strict";

require('app-module-path').addPath(__dirname + '/..');

var path = require('path');
var config = require('config');

console.log('============= TEST CONFIG =============');
console.log('EM_AWS_REGION: ' + config.get('EM_AWS_REGION'));
console.log('EM_AWS_RESOURCE_PREFIX: ' + config.get('EM_AWS_RESOURCE_PREFIX'));
console.log('=======================================');