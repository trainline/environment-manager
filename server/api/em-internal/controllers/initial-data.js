/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('config');
let _ = require('lodash');

const APP_VERSION = config.get('APP_VERSION');
const IS_REMOTE_DEBUG = config.get('IS_REMOTE_DEBUG');
const links = config.getUserValue('local').content.links;
const FEATURE_DISABLE_SERVICE = true;

function getIP() {
  try {
    return _.chain(require('os').networkInterfaces())
      .values()
      .flatten()
      .find({ family: 'IPv4', internal: false })
      .value()
      .address;
  } catch (error) {
    return '127.0.0.1';
  }
}

/**
 * This is JSONP with initial state of an app, if user is not logged in, no need to send any information.
 * User will see a login form.
 */
module.exports = function getInitialData(request, response) {
  let str = '';
  str += `window.version = '${APP_VERSION}'; `;
  str += `window.FEATURE_DISABLE_SERVICE = ${FEATURE_DISABLE_SERVICE}; `;

  if (request.user !== undefined) {
    let userJson = JSON.stringify(request.user.toJson());
    str += `window.links = ${JSON.stringify(links)}; `;
    str += `window.user = new User(${userJson}); `;
  }

  if (IS_REMOTE_DEBUG) {
    const DEBUG_PORT = config.get('DEBUG_PORT');
    const IP = getIP();
    str += `window.remoteDebugger='${IP}:${DEBUG_PORT}'; `;
  }

  response.send(str);
};
