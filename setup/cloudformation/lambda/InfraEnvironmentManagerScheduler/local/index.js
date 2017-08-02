/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict'

let config = require('./config.json');
let emFactory = require('../services/em');
let schedulerFactory = require('../scheduler');

let awsConfig = { region: 'eu-west-1' };

function ConsoleLogger() {
  let logFn = console.log;
  this.error = logFn;
  this.warn = logFn;
  this.info = logFn;
  this.log = logFn;
  this.debug = logFn;
  this.close = () => {};
  this.createSubLogger = _ => this;
}

let logger = new ConsoleLogger();

let em = emFactory.create(config.em, logger);

let context = { awsAccountId: 123456789, awsRegion: 'eu-west-1', env: { CHILD_ACCOUNT_ROLE_NAME: 'enterRoleName' } };
let scheduler = schedulerFactory.create(config, em, require('aws-sdk'), context, logger);

let write = result => console.log(JSON.stringify(result, null, 2));

scheduler.doScheduling()
  .then(write).catch(write);