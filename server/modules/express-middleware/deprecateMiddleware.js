/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/**
 * Express middleware that adds deprecated=true to a request and sets the Warning HTTP header
 * on the response if it is a request to a deprecated route.
 */

'use strict';

function create(fn) {
  return function deprecateMiddleware(req, res, next) {
    try {
      let warning = fn(req);
      if (warning) {
        let now = new Date().toUTCString();
        res.locals.deprecated = true;
        res.append('Warning', `299 - Deprecated: ${warning} "${now}"`);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = create;
