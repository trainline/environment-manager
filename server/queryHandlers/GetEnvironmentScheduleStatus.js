/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let moment = require('moment');
let cronService = require('modules/cronService')();
let config = require('config');
let OpsEnvironment = require('models/OpsEnvironment');

function handler(query) {
  return OpsEnvironment.getByName(query.environmentName).then(opsEnvironment => {
    var schedule = opsEnvironment.getSchedule(moment(query.date).toDate());
    return { status: schedule };
  });
};

module.exports = handler;
