/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const IS_PROD = require('../../config').get('IS_PRODUCTION');
let _ = require('lodash');

function defaultErrorHandler(err, req, res, next) {
  let friendlyError = {};

  if (res.statusCode >= 400 && res.statusCode < 500) {
    try {
      friendlyError.error = err.message;
      friendlyError.details = _.map(_.get(err, 'results.errors'), error => `${error.path}: ${error.message}`);
    } catch (error) {
      friendlyError = err;
    }
  } else {
    if (res.statusCode === 200) {
      res.status(getStatusByErrorType(err));
    }
    friendlyError.error = err.message;
  }

  friendlyError.originalException = err;

  if (IS_PROD && res.statusCode === 500) {
    friendlyError = {
      error: 'An internal error has occurred.'
    };
  } else if (res.statusCode === 409) {
    friendlyError = {
      error: 'The item you are attempting to update has already been modified. Check your expected-version.'
    };
  }

  res.json(friendlyError);
}

function getStatusByErrorType(error) {
  switch (error.name) {
    case 'AutoScalingGroupNotFoundError':
    case 'ImageNotFoundError':
    case 'InstanceNotFoundError':
    case 'InstanceProfileNotFoundError':
    case 'ResourceNotFoundError':
    case 'RoleNotFoundError':
    case 'SecurityGroupNotFoundError':
    case 'TopicNotFoundError':
    case 'DynamoItemNotFoundError': return 404;
    case 'ResourceLockedError': return 423;
    case 'EvalError':
    case 'InternalError':
    case 'RangeError':
    case 'ReferenceError':
    case 'SyntaxError':
    case 'TypeError':
    case 'URIError':
    case 'AssertionError': return 500;

    default: return 400;
  }
}

module.exports = defaultErrorHandler;
