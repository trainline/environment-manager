/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

require('app-module-path').addPath(__dirname + '/..');

var path = require('path');
var config = require('config');
let localConfig = require('configuration.sample');

config.setUserValue('masterAccountName', 'Sandbox');
config.setUserValue('local', localConfig);

