'use strict'

let config = require('./config.json');
let schedulerFactory = require('../scheduler.js');

let scheduler = schedulerFactory.create(config);

scheduler
  .doScheduling()
  .then(result => { console.log(JSON.stringify(result, null, 2)); })
  .catch(err => { console.log(JSON.stringify(err, null, 2)); });