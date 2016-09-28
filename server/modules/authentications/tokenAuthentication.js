/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let User = require('modules/user');
let userService = require('modules/user-service');

const PATTERN = /bearer\s+(.*)/i;

module.exports = {
  middleware: function (req, res, next) {
    if (req.user && req.user.isAuthenticated()) return next();

    var authorization = req.headers.authorization;
    if (!authorization) return next();

    var match = PATTERN.exec(authorization);
    if (!match) return next();

    userService.getUserByToken(match[1])
      .then((user) => {
        req.user = user;
        req.authenticatedBy = 'bearer';
        return next();
      }, (error) => {
        res.status(401);
        res.send(error.message);
      });
  },
};
