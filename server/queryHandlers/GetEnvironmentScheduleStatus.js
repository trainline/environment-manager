/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let moment = require('moment');
let OpsEnvironment = require('models/OpsEnvironment');

function handler(query) {
  return OpsEnvironment.getByName(query.environmentName).then((opsEnvironment) => {
    let schedule = opsEnvironment.getScheduleStatus(moment(query.date).toDate());
    return { status: schedule };
  });
}

module.exports = handler;
