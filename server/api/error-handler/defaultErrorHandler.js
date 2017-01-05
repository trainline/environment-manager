/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

const IS_PROD = require('config').get('IS_PRODUCTION');

let logger = require('modules/logger');

function defaultErrorHandler(err, req, res, next) {
  let friendlyError = {};
  if (res.statusCode >= 400 && res.statusCode < 500) {
    try {
      friendlyError.error = err.message;
      if (err.results && err.results.errors) {
        friendlyError.details = err.results.errors.map(e => e.message);
      }
    } catch (error) {
      friendlyError = err;
    }
  } else {
    if (res.statusCode === 200) {
      res.status(getStatusByErrorType(err));
    }
    friendlyError.error = err.message;
  }

  if (IS_PROD && res.statusCode === 500) {
    friendlyError.error = 'An internal error has occurred.'
  } else if (res.statusCode === 409) {
    friendlyError.error = 'The item you are attempting to update has already been modified. Check your expected-version.'
  }

  logger.error(err.stack);
  res.json(friendlyError);
}

function getStatusByErrorType(error) {
  switch(error.name) {
    case 'AutoScalingGroupNotFoundError':
    case 'ImageNotFoundError':
    case 'InstanceNotFoundError':
    case 'InstanceProfileNotFoundError':
    case 'ResourceNotFoundError':
    case 'RoleNotFoundError':
    case 'SecurityGroupNotFoundError':
    case 'TopicNotFoundError':
    case 'DynamoItemNotFoundError':     return 404;   break;

    case 'DynamoConcurrencyError':      return 409;   break;
    
    case 'EvalError':
    case 'InternalError':
    case 'RangeError':
    case 'ReferenceError':
    case 'SyntaxError':
    case 'TypeError':
    case 'URIError':
    case 'AssertionError':              return 500;   break;

    default:                            return 400;   break;
  }
}

module.exports = defaultErrorHandler;
