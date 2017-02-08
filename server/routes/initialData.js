/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('config');

const APP_VERSION = config.get('APP_VERSION');
const links = config.getUserValue('local').content.links;
const FEATURE_DISABLE_SERVICE = true;

/**
 * This is JSONP with initial state of an app, if user is not logged in, no need to send any information.
 * User will see a login form.
 */
module.exports = function (request, response) {
  let str = '';
  str += `window.version = '${APP_VERSION}'; `;
  str += `window.FEATURE_DISABLE_SERVICE = ${FEATURE_DISABLE_SERVICE}; `;

  if (request.user !== undefined) {
    let userJson = JSON.stringify(request.user.toJson());
    str += `window.links = ${JSON.stringify(links)}; `;
    str += `window.user = new User(${userJson}); `;
  }

  response.send(str);
};
