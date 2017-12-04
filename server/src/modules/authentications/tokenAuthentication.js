/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let userService = require('../user-service');

const PATTERN = /bearer\s+(.*)/i;

module.exports = {
  middleware(req, res, next) {
    if (req.user) return next();

    let authorization = req.headers.authorization;
    if (!authorization) return next();

    let match = PATTERN.exec(authorization);
    if (!match) return next();

    return userService.getUserByToken(match[1])
      .then((user) => {
        req.user = user;
        req.authenticatedBy = 'bearer';
        return next();
      }, (error) => {
        res.status(401);
        res.send(error.message);
      });
  }
};
