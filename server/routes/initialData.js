/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const APP_VERSION = require('config').get('APP_VERSION');
let links = require('config').getUserValue('local').content.links

module.exports = function (request, response) {
  let data = {
    user: JSON.stringify(request.user.toJson()),
    version: APP_VERSION,
  };

  // TODO(filip): refactor front code so we can send single data object rather than code
  let str = `window.user = new User(${data.user}); window.version = '${data.version}'; window.links = ${JSON.stringify(links)}`;
  response.send(str);
};
