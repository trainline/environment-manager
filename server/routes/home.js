/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('../config');
let renderer = require('../modules/renderer');

const PUBLIC_DIR = config.get('PUBLIC_DIR');

renderer.register('home', `${PUBLIC_DIR}/index.html`);

module.exports = function (request, response) {
  renderer.render('home', {}, content => response.send(content));
};
