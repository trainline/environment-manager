/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let User = require('modules/user');
let userService = require('modules/user-service');
let cookieAuthenticationConfiguration = require('modules/authentications/cookieAuthenticationConfiguration');

module.exports = {
  middleware: function (req, res, next) {
    if (req.user && req.user.isAuthenticated()) return next();

    var cookie = req.cookies[cookieAuthenticationConfiguration.getCookieName()];
    if (!cookie) return next();
    userService.getUserByToken(cookie)
      .then((user) => {
        req.user = user;
        req.authenticatedBy = 'cookie';
        next();
      }, (error) => next());
  },
};
