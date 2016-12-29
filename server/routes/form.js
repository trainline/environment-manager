/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let ms = require('ms');
let url = require('url');
let co = require('co');
let querystring = require('querystring');
let userService = require('modules/user-service');
let cookieConfiguration = require('modules/authentications/cookieAuthenticationConfiguration');
let renderer = require('modules/renderer');
let utils = require('modules/utilities');
let logger = require('modules/logger');
let config = require('config');

const APP_VERSION = config.get('APP_VERSION');
const PUBLIC_DIR = config.get('PUBLIC_DIR');

renderer.register('login', `${PUBLIC_DIR}/login.html`);

function serveLoginPage(response, error, username) {
  let content = {
    data: {
      error: error ? error.message : undefined,
      version: APP_VERSION,
      username: username
    },
  };

  renderer.render('login', content, (content) => {
    response.send(content);
  });
}

module.exports = {
  logout: {
    get: (request, response) => {
      response.clearCookie(cookieConfiguration.getCookieName());
      response.redirect('/');
    },
  },
  login: {
    get: (request, response) => {
      serveLoginPage(response);
    },

    post: (request, response) => {
      co(function* () {
        let duration = cookieConfiguration.getCookieDuration();

        let credentials = {
          username: request.body.username,
          password: request.body.password,
          scope: 'ui',
        };

        let token = yield userService.authenticateUser(credentials, duration);
        let qs = querystring.parse(url.parse(request.headers.referer).query);
        let cookieName = cookieConfiguration.getCookieName();
        let cookieValue = token;
        let cookieOptions = { expires: utils.offsetMilliseconds(new Date(), ms(duration)) };

        response.cookie(cookieName, cookieValue, cookieOptions);
        let targetUrl = qs.returnUrl || '/';

        response.redirect(targetUrl);
      }).catch((error) => {
        logger.warn(error);
        serveLoginPage(response, error, request.body.username);
      });
    },
  },
};
