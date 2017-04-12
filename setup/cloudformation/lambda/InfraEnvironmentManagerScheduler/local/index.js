/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict'

let config = require('./config.json');
let schedulerFactory = require('../scheduler.js');

let scheduler = schedulerFactory.create(config);

let write = result => console.log(JSON.stringify(result, null, 2));

scheduler.doScheduling()
  .then(write).catch(write);