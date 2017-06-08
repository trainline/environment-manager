/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict'

let config = require('./config.json');
let emFactory = require('../services/em');
let schedulerFactory = require('../scheduler');

let awsConfig = { region: 'eu-west-1' };
let em = emFactory.create(config.em);

let context = { awsAccountId: 743871665500, awsRegion: 'eu-west-1', env: { CHILD_ACCOUNT_ROLE_NAME: 'roleInfraEMScheduler' } };
let scheduler = schedulerFactory.create(config, em, require('aws-sdk'), context);

let write = result => console.log(JSON.stringify(result, null, 2));

scheduler.doScheduling()
  .then(write).catch(write);