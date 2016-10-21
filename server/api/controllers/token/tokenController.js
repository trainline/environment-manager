/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let noAuthorization = require('modules/authorizers/none');
let userService = require('modules/user-service');
let tokenConfiguration = require('modules/authentications/tokenAuthenticationConfiguration');

/**
 * POST /token
 */
function postAuthorization(req, res, next) {
  let body = req.swagger.params.body.value;
  let credentials = {
      username: body.username,
      password: body.password,
      scope: 'api',
    };

    let duration = tokenConfiguration.getTokenDuration();

    userService.authenticateUser(credentials, duration)
      .then(value => res.json(value)).catch(next);
}

module.exports = {
  postAuthorization
};
