/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let route = require('modules/helpers/route');

const APP_VERSION = require('config').get('APP_VERSION');

module.exports = route
  .get('/diagnostics/status')
  .inOrderTo('Show server status and current package version.')
  .allowAnonymous()
  .do((request, response) => {
    response.send({
      status: 'OK',
      version: APP_VERSION,
    });
  });
