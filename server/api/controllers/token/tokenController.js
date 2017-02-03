/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

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
    scope: 'api'
  };

  let duration = tokenConfiguration.getTokenDuration();

  userService.authenticateUser(credentials, duration)
    .then(value => res.send(value)).catch(next);
}

/**
 * DELETE /token
 */
function signOut(req, res, next) {
  let token = req.cookies.environmentmanager;

  if (!token) {
    res.status(400).end();
  }

  userService.signOut(token)
    .then(_ => res.status(200).end()).catch(next);
}

module.exports = {
  postAuthorization,
  signOut
};
