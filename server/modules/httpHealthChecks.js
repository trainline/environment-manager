/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let express = require('express');
let co = require('co');
let _ = require('lodash');

let healthChecks = require('modules/health-checks');

let statusCodes = _.fromPairs([
  [healthChecks.resultCodes.SUCCESS, 200],
  [healthChecks.resultCodes.FAIL, 500]
]);

function buildRouter() {
  let router = express.Router();
  healthChecks.checks.forEach((check) => {
    let middleware = toMiddleware(check.run);
    router.get(check.url, middleware);
  });
  return router;
}

function toMiddleware(check) {
  return (req, res, next) => {
    co(function* () {
      let checkReport = yield runCheck(check);
      let statusCode = statusCodes[checkReport.result];
      res.status(statusCode).json(checkReport);
    });
  };
}

function runCheck(check) {
  try {
    return check().catch(err => errorResult(err));
  } catch (err) {
    return Promise.resolve(errorResult(err));
  }
}

function errorResult(error) {
  return {
    result: healthChecks.resultCodes.FAIL,
    reason: 'An error occurred',
    error: {
      message: error.message,
      stack: error.stack
    }
  };
}

module.exports = {
  router: buildRouter()
};
