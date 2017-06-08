/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let rl = require('roast-lambda');
let co = require('co');

let schedulerFactory = require('./scheduler.js');
let environment = require('./environment.js');
let awsFactory = require('./services/aws');
let emFactory = require('./services/em');

exports.handler = rl.init({
  handler: ({ context, AWS, logger }) => {
    return co(function* () {
      let config = yield environment.getConfig(AWS, context);
      
      let em = emFactory.create(config.em);

      let scheduler = schedulerFactory.create(config, em, AWS, context, logger);
      let result = yield scheduler.doScheduling();
      
      if (!result.success && config.errorOnFailure) {
        return Promise.reject({
          error: 'Scheduling Failure',
          report: result
        });
      }

      return result;
    });
  }
});