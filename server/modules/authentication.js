/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let querystring = require('querystring');
let cookieAuthenticationConfiguration = require('modules/authentications/cookieAuthenticationConfiguration');

function isUserAuthenticated(user) {
  return !!user;
}

function getRedirectUrl(request) {
  let returnUrl = request.url;
  let qs = querystring.stringify({ returnUrl });
  return `${cookieAuthenticationConfiguration.getLoginUrl()}?${qs}`;
}

module.exports = {
  allowUnknown(request, response, next) {
    return next();
  },

  denyUnauthorized(request, response, next) {
    // User not authenticated
    if (!isUserAuthenticated(request.user)) {
      let redirectUrl = getRedirectUrl(request);
      response.redirect(redirectUrl);
    } else {
      next();
    }
  }
};
