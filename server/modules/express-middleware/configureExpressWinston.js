/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/**
 * Generate configuration to pass to express-winston.logger
 */

'use strict';

let expressWinston = require('express-winston');
let fp = require('lodash/fp');
let logger = require('modules/logger');

const requestWhitelist = ['body', 'id'];

/**
 * Display the username of the request initiator
 */
function dynamicMeta(req, res) {
  return {
    username: (req.user && typeof req.user.getName === 'function') ? req.user.getName() : null,
    deprecated: (res.locals && res.locals.deprecated)
  };
}

/**
 * Do not log the authorization token.
 */
function requestFilter(req, propName) {
  if (propName === 'headers') {
    return fp.omit(['authorization', 'cookie'])(req[propName]);
  }
  return req[propName];
}

function errorLoggerOptions() {
  return {
    dynamicMeta,
    requestFilter,
    requestWhitelist: expressWinston.requestWhitelist.concat(requestWhitelist),
    winstonInstance: logger
  };
}

function loggerOptions() {
  /**
   * Only log requests if the corresponding response has a non-success status code
   * or is for a deprecated route.
   */
  function skip(req, res) {
    return res && typeof res.statusCode === 'number' && res.statusCode <= 400 && !res.locals.deprecated;
  }

  /**
   * Never log requests to some routes
   */
  function ignoreRoute(req, res) {
    let routePrefixes = [
      '/api/diagnostics'
    ];
    return routePrefixes.some(routePrefix => req.url.startsWith(routePrefix));
  }

  return {
    bodyBlacklist: ['password'], // Do log password that appears in the body of a request
    dynamicMeta,
    ignoreRoute,
    requestFilter,
    requestWhitelist: expressWinston.requestWhitelist.concat(requestWhitelist),
    responseWhitelist: expressWinston.responseWhitelist.concat(['body', 'locals']), // Log the body of the response
    skip,
    statusLevels: true,
    winstonInstance: logger
  };
}

module.exports = {
  loggerOptions,
  errorLoggerOptions
};
