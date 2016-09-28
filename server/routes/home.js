/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let renderer = require('modules/renderer');
renderer.register('home', '../client/index.html');

const APP_VERSION = require('config').get('APP_VERSION');

module.exports = function (request, response) {

  renderer.render('home', {}, content => response.send(content));

};
