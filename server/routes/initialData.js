/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let config = require('config');

const APP_VERSION = config.get('APP_VERSION');
const links = config.getUserValue('local').content.links;
const FEATURE_DISABLE_SERVICE = true;

module.exports = function (request, response) {
  let data = {
    user: JSON.stringify(request.user.toJson()),
    version: APP_VERSION,
  };

  // TODO(filip): refactor front code so we can send single data object rather than code
  let str = ``;
  str += `window.user = new User(${data.user}); `;
  str += `window.version = '${data.version}'; `;
  str += `window.links = ${JSON.stringify(links)}; `;
  str += `window.FEATURE_DISABLE_SERVICE = ${FEATURE_DISABLE_SERVICE}; `;

  response.send(str);
};
