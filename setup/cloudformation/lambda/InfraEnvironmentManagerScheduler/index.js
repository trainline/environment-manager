/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let process = require('process');
let schedulerFactory = require('./scheduler.js');

exports.handler = (event, context, callback) => {
  let config = getEnvironmentConfig(context);
  let scheduler = schedulerFactory.create(config);

  doSafely(scheduler.doScheduling)
  .then((result) => {
    if (result.success) {
      callback(null, logSuccess(result));
    } else {
      if (config.errorOnFailure) callback(logError('Scheduling Failure', result));
      else callback(null, logError('Scheduling Failure', result));
    }
  })
  .catch(err => {
    callback(logError('Unhandled Exception', err));
  });
};

function getEnvironmentConfig(context) {
  let IGNORE_ASG_INSTANCES = hasValue(process.env.IGNORE_ASG_INSTANCES, 'true');
  let LIST_SKIPPED_INSTANCES = hasValue(process.env.LIST_SKIPPED_INSTANCES, 'true');
  let WHAT_IF = hasValue(process.env.WHAT_IF, 'true');
  let ERROR_ON_FAILURE = !hasValue(process.env.ERROR_ON_FAILURE, 'false');

  let aws = getAwsDetailsFromContext(context);

  return {
    aws: {
      region: aws.region
    },
    em: {
      host: process.env.EM_HOST,
      awsAccount: aws.account,
      credentials: {
        username: process.env.EM_USERNAME,
        password: process.env.EM_PASSWORD
      }
    },
    limitToEnvironment: process.env.LIMIT_TO_ENVIRONMENT,
    ignoreASGInstances: IGNORE_ASG_INSTANCES,
    listSkippedInstances: LIST_SKIPPED_INSTANCES,
    whatIf: WHAT_IF,
    errorOnFailure: ERROR_ON_FAILURE
  };
}

function hasValue(val, testVal) {
  return !!val && val.trim().toLowerCase() === testVal.trim().toLowerCase();
}

function getAwsDetailsFromContext(context) {
  let arn = context.invokedFunctionArn.split(':');
  return { region: arn[3], account: arn[4] };
}

function logSuccess(result) {
  console.log(JSON.stringify(result, null, 2));
  return `SUCCESS! See logs for more details.`;
}

function logError(err, details) {
  console.error(JSON.stringify({ err, details }, null, 2));
  return `ERROR: ${err}. See logs for more details.`;
}

function doSafely(fn) {
  try { return fn(); }
  catch (err) { return Promise.reject(err); }
}