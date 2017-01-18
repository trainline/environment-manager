/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let winston = require('winston');

let AWS = require('aws-sdk');

let config = require('config/');
const EM_LOG_LEVEL = config.get('EM_LOG_LEVEL').toLowerCase();

// Set up formatter - if local, leave undefined
let formatter;
if (config.get('IS_PRODUCTION') === true) {
  formatter = function (options) {
    let eventtype = 'default';

    // eventtype can be used in Kibana to filter logs for AWS / HTTP logs
    if (options.message.startsWith('[AWS')) {
      eventtype = 'aws';
    } else if (options.meta !== undefined && options.meta.req !== undefined) {
      eventtype = 'http';
    }

    let entry = {
      message: options.message,
      level: options.level,
      name: 'environment-manager',
      eventtype,
      releaseversion: process.env.RELEASE_VERSION || config.get('APP_VERSION'),
      meta: options.meta
    };
    return JSON.stringify(entry);
  };
}

const logger = new (winston.Logger)({
  transports: [
    new (winston.transports.Console)({
      level: EM_LOG_LEVEL,
      showLevel: false,
      formatter
    })
  ]
});

if (config.get('IS_PRODUCTION') === true) {
  // Globally configure aws-sdk to log all activity.
  AWS.config.update({
    logger: {
      log: logger.debug.bind(logger)
    }
  });
}

logger.info(`Starting logger with log level ${EM_LOG_LEVEL}`);

module.exports = logger;
