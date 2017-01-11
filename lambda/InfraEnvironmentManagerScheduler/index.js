/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let config = require('./config.json');
let schedulerFactory = require('./scheduler.js');

exports.handler = (event, context, callback) => {

  let account = context.invokedFunctionArn.split(':')[4];
  let scheduler = schedulerFactory.create(account, config);

  try {

    scheduler.doScheduling()
    .then(result => {
      if (result.success) callback(null, logSuccess(result));
      else callback(logError('Scheduling Failure', result));
    })
    .catch(err => {
      callback(logError('Unhandled Exception', err));
    });

  } catch (err) {
    callback(logError('Unhandled Exception', err));
  }

};

function logSuccess(result) {
  console.log(JSON.stringify(result, null, 2));
  return `SUCCESS! See logs for more details.`;
}

function logError(err, details) {
  console.error(JSON.stringify({ err, details }, null, 2));
  return `ERROR: ${err}. See logs for more details.`;
}