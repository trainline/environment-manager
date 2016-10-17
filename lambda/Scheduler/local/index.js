'use strict'

let config = require('./config.json');
let schedulerFactory = require('../scheduler.js');

let account = 'enter-em-account-name';
let scheduler = schedulerFactory.create(account, config);

scheduler
  .doScheduling()
  .then(result => { console.log(JSON.stringify(result, null, 2)); })
  .catch(err => { console.log(JSON.stringify(err, null, 2)); });