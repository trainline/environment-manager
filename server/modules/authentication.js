/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function isUserAuthenticated(user) {
  return !!user;
}

module.exports = {
  allowUnknown(request, response, next) {
    return next();
  },

  denyUnauthorized(request, response, next) {
    // User not authenticated
    if (!isUserAuthenticated(request.user)) {
      response.status(403);
      response.json({
        error: 'Access denied. Please log in'
      });
    } else {
      next();
    }
  }
};
