/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/**
 * Generate configuration to pass to express-winston.logger
 */

'use strict';

let expressWinston = require('express-winston');
let fp = require('lodash/fp');
let logger = require('modules/logger');

function loggerOptions({ requestWhitelist }) {
  /**
   * Do not log the authorization token.
   */
  function requestFilter(req, propName) {
    if (propName === 'headers') {
      return fp.omit(['authorization'])(req[propName]);
    }
    return req[propName];
  }

  /**
   * Only log requests if the corresponding response has a non-success status code
   */
  function skip(req, res) {
    return res && typeof res.statusCode === 'number' && res.statusCode <= 400;
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
    ignoreRoute,
    requestFilter,
    requestWhitelist: expressWinston.requestWhitelist.concat(requestWhitelist),
    responseWhitelist: expressWinston.responseWhitelist.concat(['body']), // Log the body of the response
    skip,
    statusLevels: true,
    winstonInstance: logger
  };
}

module.exports = {
  loggerOptions,
  errorLoggerOptions: loggerOptions
};
