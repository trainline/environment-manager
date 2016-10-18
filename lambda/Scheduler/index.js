'use strict'

let config = require('./config.json');
let schedulerFactory = require('./scheduler.js');

exports.handler = (event, context, callback) => {

  let scheduler = schedulerFactory.create(config);

  try {

    scheduler.doScheduling()
    .then(result => {
      if (result.success)
        callback(null, result);
      else {
        console.log('Scheduling Failure');
        console.log(JSON.stringify(result, null, 2));
        callback('An unhandled scheduling exception occurred. See log for more details');
      }
    })
    .catch(err => {
      console.log('Unhandled Exception');
      console.log(JSON.stringify(err, null, 2));
      callback('An unhandled async exception ocurred. See log for more details');
    });

  } catch (err) {
    console.log('Unhandled Exception');
    console.log(JSON.stringify(err, null, 2));
    callback('An unhandled exception ocurred. See log for more details');
  }

};