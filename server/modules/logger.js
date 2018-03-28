/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const pino = require('pino')();
const _ = require('lodash');
const config = require('../config');

const createLogEntryDetails = (type, ...args) => {
  let logParts = extractMessageAndDetails(...args);

  let entry = {
    name: 'environmentmanager',
    environment: config.get('EM_AWS_RESOURCE_PREFIX').replace('-', '') || 'mn1',
    message: logParts.message,
    details: logParts.details,
    eventtype: 'app',
    releaseversion: process.env.RELEASE_VERSION || config.get('APP_VERSION'),
    severity: type
  };

  _.assign(entry, logParts.indexables);

  return entry;
};

const createLoggerType = (type) => {
  return (...args) => {
    pino.info(createLogEntryDetails(type, ...args));
  };
};

let logger = {
  log: createLoggerType('info'),
  info: createLoggerType('info'),
  warn: createLoggerType('warn'),
  error: createLoggerType('error'),
  debug: createLoggerType('debug'),
  createLogEntryDetails
};

let extractMessageAndDetails = (...args) => {
  let first = args[0];
  let otherArgs = _.slice(args, 1);

  let message;
  let indexables;
  let details;

  if (first instanceof Error) {
    message = first.message;
    details = JSON.stringify(first.stack);
  } else if (_.isObjectLike(first)) {
    message = first.message || _.truncate(JSON.stringify(first), 80);
    indexables = extractIndexableFields(first);
    details = JSON.stringify(args);
  } else {
    message = first;
    details = JSON.stringify(otherArgs);
  }

  return { message, indexables, details };
};

let extractIndexableFields = (o) => {
  let indexableKeys = ['message', 'trace-id', 'eventtype'];
  return _.fromPairs(_.entries(o).filter(prop => _.includes(indexableKeys, prop[0].toLowerCase())));
};

const AWS = require('aws-sdk');
const IS_PROD = config.get('IS_PRODUCTION');

if (IS_PROD) {
  AWS.config.update({
    logger: {
      log: message => logger.log({ message, eventtype: 'aws' })
    }
  });
}

module.exports = logger;
