/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let rl = require('roast-lambda');
let co = require('co');

let schedulerFactory = require('./scheduler.js');
let environment = require('./environment.js');
let awsFactory = require('./services/aws');
let emFactory = require('./services/em');

let config;

exports.handler = rl.init({
  handler: ({ context, AWS, logger }) => {
    return co(function* () {
      let aws = awsFactory.create(AWS, { region: context.awsRegion });

      if (!config) config = yield environment.getConfig(context, aws.kms);
      
      let em = emFactory.create(context.awsAccountId, config.em);

      let scheduler = schedulerFactory.create(config, em, aws.ec2);
      let result = yield scheduler.doScheduling();
      
      if (!result.success && config.errorOnFailure) {
        return Promise.reject({
          error: 'Scheduling Failure',
          report: result
        });
      }

      logResult(logger, result);
      return result;
    });
  }
});

function logResult(logger, result) {
  if (result.success) {
    logger.log('Scheduling completed successfully!', result);
  } else {
    logger.warn('Scheduling completed but with some errors.', result);
  }
}