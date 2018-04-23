/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let userService = require('../user-service');
let cookieAuthenticationConfiguration = require('./cookieAuthenticationConfiguration');

module.exports = {
  authenticator(req, res, next) {
    if (req.user) return next();

    let cookie = req.cookies[cookieAuthenticationConfiguration.getCookieName()];
    if (!cookie) return next();

    return userService.getUserByToken(cookie)
      .then((user) => {
        req.user = user;
        req.authenticatedBy = 'cookie';
        next();
      }, () => next());
  },
  persister(req, res) {
    userService.createTokenForUser(req.user, cookieAuthenticationConfiguration.getCookieDuration()).then((token) => {
      let cookieName = cookieAuthenticationConfiguration.getCookieName();
      let cookieValue = token;
      let cookieOptions = cookieAuthenticationConfiguration.buildCookieOptions();
      res.cookie(cookieName, cookieValue, cookieOptions);
      res.redirect('/');
    });
  }
};
