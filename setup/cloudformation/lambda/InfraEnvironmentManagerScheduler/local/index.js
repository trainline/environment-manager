/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict'

let config = require('./config.json');
let awsFactory = require('../services/aws');
let emFactory = require('../services/em');
let schedulerFactory = require('../scheduler');

let awsConfig = { account: 'enter-account-name', region: 'eu-west-1' };

let aws = awsFactory.create({ region: awsConfig.region });
let em = emFactory.create(awsConfig.account, config.em);

let scheduler = schedulerFactory.create(config, em, aws.ec2);

let write = result => console.log(JSON.stringify(result, null, 2));

scheduler.doScheduling()
  .then(write).catch(write);