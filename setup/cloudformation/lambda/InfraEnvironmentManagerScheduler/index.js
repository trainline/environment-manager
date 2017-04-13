/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');

let schedulerFactory = require('./scheduler.js');
let environment = require('./environment.js');
let awsFactory = require('./services/aws');
let emFactory = require('./services/em');

let config;

exports.handler = (event, context, callback) => {
  return co(function* () {
    let awsConfig = getAwsConfigFromContext(context);
    let aws = awsFactory.create({ region: awsConfig.region });

    if (!config) config = yield environment.getConfig(aws.kms);
    
    let em = emFactory.create(awsConfig.account, config.em);

    let scheduler = schedulerFactory.create(config, em, aws.ec2);
    let result = yield scheduler.doScheduling();

    if (result.success) {
      callback(null, logSuccess(result));
    } else {
      if (config.errorOnFailure) callback(logError('Scheduling Failure', result));
      else callback(null, logError('Scheduling Failure', result));
    }
  }).catch(err => callback(logError('Unhandled Exception', err)));
};

function getAwsConfigFromContext(context) {
  let arn = context.invokedFunctionArn.split(':');
  return { region: arn[3], account: arn[4] };
}

function logSuccess(result) {
  console.log(JSON.stringify(result, null, 2));
  return `SUCCESS! See logs for more details.`;
}

function logError(err, details) {
  console.error(JSON.stringify({ err, details: details.stack || details }, null, 2));
  return `ERROR: ${err}. See logs for more details.`;
}