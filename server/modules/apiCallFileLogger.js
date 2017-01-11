/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const fs = require('fs');
const winston = require('winston');

let winstonLogger;

try {
  let debugOptionsFileContents = fs.readFileSync('debug-options.json', 'utf8');
  let debugOptions = JSON.parse(debugOptionsFileContents);

  winstonLogger = new (winston.Logger)({
    transports: [
      new (winston.transports.File)({ filename: debugOptions.apiCallLogFile }),
    ],
  });
} catch (err) {
  // eslint-disable-line no-empty
}

let logFn = (() => {
  if (!winstonLogger) return () => {};

  return (request) => {
    winstonLogger.info({
      user: request.user ? request.user.getName() : 'Unknown',
      url: request.url,
    });
  };
})();

let logger = {
  log: logFn,
};

module.exports = (request, response, next) => {
  logger.log(request);
  next();
};
