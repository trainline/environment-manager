/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let userService = require('../../../modules/user-service');
let tokenConfiguration = require('../../../modules/authentications/tokenAuthenticationConfiguration');
let cookieConfiguration = require('../../../modules/authentications/cookieAuthenticationConfiguration');

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
  let token = getToken(req);

  if (!token) {
    res.status(400).end();
  } else {
    userService.signOut(token)
      .then(() => res.status(200).end()).catch(next);
  }
}

function getToken(req) {
  let cookie = req.cookies[cookieConfiguration.getCookieName()];
  if (cookie) return cookie;

  let authorization = req.headers.authorization;
  if (!authorization) return null;

  let match = /bearer\s+(.*)/i.exec(authorization);
  if (!match) return null;

  return match[1];
}

module.exports = {
  postAuthorization,
  signOut
};
