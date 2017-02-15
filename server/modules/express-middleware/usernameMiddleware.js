/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/**
 * Express middleware that writes the username of the request sender to a property of the request.
 * This middleware should go after any authentication middleware and before any logging middleware.
 */

'use strict';

function create({ usernameProperty }) {
  return function usernameMiddleware(req, res, next) {
    try {
      if (req.user && typeof req.user.getName === 'function') {
        req[usernameProperty] = req.user.getName();
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = create;
