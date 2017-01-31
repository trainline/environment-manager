/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let ms = require('ms');
let noAuthorization = require('modules/authorizers/none');
let userService = require('modules/user-service');
let utils = require('modules/utilities');
let tokenConfiguration = require('modules/authentications/tokenAuthenticationConfiguration');
let cookieConfiguration = require('modules/authentications/cookieAuthenticationConfiguration');

/**
 * POST /login
 */
function* login(req, res, next) {
  let body = req.swagger.params.body.value;
  let duration = cookieConfiguration.getCookieDuration();

  let credentials = {
    username: req.body.username,
    password: req.body.password,
    scope: 'ui'
  };

  let token = yield userService.authenticateUser(credentials, duration);
  let cookieName = cookieConfiguration.getCookieName();
  let cookieValue = token;
  let cookieOptions = { expires: utils.offsetMilliseconds(new Date(), ms(duration)) };

  res.cookie(cookieName, cookieValue, cookieOptions);

  userService.authenticateUser(credentials, duration)
    .then(value => res.send(value)).catch(next);
}

/**
 * POST /logout
 */
function logout(req, res, next) {
  res.clearCookie(cookieConfiguration.getCookieName());
  res.json({ ok: true });
}

module.exports = {
  login: co.wrap(login),
  logout
};
