/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

/**
 * Express Middleware to log requests and errors
 */

'use strict';

const fp = require('lodash/fp');
const miniStack = require('modules/miniStack');
const path = require('path');

let redactSecrets = fp.cloneDeepWith((value, key) => (/password/i.test(key) ? '********' : undefined))

let swaggerParams = fp.flow(
  fp.get(['swagger', 'params']),
  fp.mapValues(({ value }) => value),
  redactSecrets
);

let getUser = fp.compose(
  f => (fp.isFunction(f) ? f() : null),
  fp.get(['user', 'getName'])
);

let tryParse = (str) => {
  try {
    return JSON.parse(str);
  } catch (e) {
    return undefined;
  }
};

let mini = (() => {
  let basePath = path.dirname(require.resolve('package.json'));
  let filePathTransform = fullPath => path.relative(basePath, fullPath);
  return miniStack({ contextLines: 0, filePathTransform });
})();

let loggerMiddleware = logger => (req, res, next) => {
  let log = () => {
    let deprecated = fp.compose(fp.defaultTo(false), fp.get(['locals', 'deprecated']))(res);
    let message = deprecated ? 'HTTP request deprecated' : 'HTTP request';
    let statusCode = fp.get(['statusCode'])(res);
    let level = (() => {
      if (statusCode >= 500) {
        return 'error';
      } else if (statusCode >= 400 || deprecated) {
        return 'warn';
      } else {
        return 'debug';
      }
    })();
    let responseFields = (() => {
      if (statusCode < 400) {
        return ['statusCode'];
      } else {
        return ['statusCode', 'body'];
      }
    })();
    let entry = {
      eventtype: 'http',
      req: {
        headers: {
          'user-agent': fp.get(['headers', 'user-agent'])(req)
        },
        id: fp.get('id')(req),
        method: fp.get('method')(req),
        originalUrl: fp.get('originalUrl')(req),
        params: req.originalUrl === '/api/token' ? redactSecrets(req.body) : swaggerParams(req)
      },
      res: fp.pick(responseFields)(res),
      user: req.originalUrl === '/api/token' ? fp.get(['body', 'username'])(req) : getUser(req)
    };
    logger.log(level, message, entry);
  };
  let send = res.send;
  res.send = (content) => {
    if (content) {
      let s = content.toString();
      res.body = tryParse(s) || s;
    }
    log();
    send.call(res, content);
  };
  next();
};

let errorLoggerMiddleware = logger => (err, req, res, next) => {
  let log = () => {
    let message = 'HTTP error';
    let entry = {
      error: {
        message: fp.get(['message'])(err),
        stack: fp.compose(fp.truncate({ length: 1400 }), mini, fp.get(['stack']))(err)
      },
      eventtype: 'http error',
      req: {
        id: fp.get('id')(req),
        method: fp.get('method')(req),
        originalUrl: fp.get('originalUrl')(req),
        params: swaggerParams(req)
      },
      user: getUser(req)
    };
    logger.error(message, entry);
  };
  res.once('close', log);
  res.once('finish', log);
  next(err);
};

module.exports = {
  loggerMiddleware,
  errorLoggerMiddleware
};
