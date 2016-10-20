'use strict'

let config = require('./config.json');
let schedulerFactory = require('./scheduler.js');

exports.handler = (event, context, callback) => {

  let account = context.invoked_function_arn.split(':')[4];
  let scheduler = schedulerFactory.create(account, config);

  try {

    scheduler.doScheduling()
    .then(result => {
      if (result.success) callback(null, result);
      else callback(logError('Scheduling Failure', result));
    })
    .catch(err => {
      callback(logError('Unhandled Exception', err));
    });

  } catch (err) {
    callback(logError('Unhandled Exception', err));
  }

};

function logError(err, details) {
  console.error({ err, details });
  return `ERROR: ${err}. See logs for more details.`;
}