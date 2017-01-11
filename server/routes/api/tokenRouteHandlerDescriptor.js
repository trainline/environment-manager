/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let route = require('modules/helpers/route');
let adapt = require('modules/callbackAdapter');
let userService = require('modules/user-service');
let tokenConfiguration = require('modules/authentications/tokenAuthenticationConfiguration');

module.exports = route
  .post('/token')
  .inOrderTo('Given url-encoded user corporate credentials it returns a bearer authorization token.')
  .withDocs({ description: 'Authentication Token', tags: ['Security and Permissions'] })
  .allowAnonymous()
  .whenRequest((url, value) => {
    if (value.grant_type !== 'password') return new Error('unsupported_grant_type');
    else return null;
  })
  .do((request, response) => {
    let credentials = {
      username: request.body.username,
      password: request.body.password,
      scope: 'api',
    };

    let callback = adapt.callbackToExpress(request, response);
    let duration = tokenConfiguration.getTokenDuration();

    userService.authenticateUser(credentials, duration)
      .then(value => callback(null, value), err => callback(err));
  });
