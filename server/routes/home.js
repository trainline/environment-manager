/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('config');

const APP_VERSION = config.get('APP_VERSION');
const PUBLIC_DIR = config.get('PUBLIC_DIR');

let renderer = require('modules/renderer');
renderer.register('home', `${PUBLIC_DIR}/index.html`);

module.exports = function (request, response) {
  renderer.render('home', {}, content => response.send(content));
};
