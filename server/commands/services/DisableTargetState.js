/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let serviceTargets = require('modules/service-targets');

function* DisableTargetState(command) {
  let environment = command.environment;
  let service = command.service;
  let serverRole = command.serverRole;
  let slice = command.slice;
  let key = `environments/${environment}/roles/${serverRole}/services/${service}/${slice}`;

  let value = yield serviceTargets.getTargetState(environment, { key });
  value.status = 'Disabled';
  return yield serviceTargets.setTargetState(environment, { key, value });
}

module.exports = co.wrap(DisableTargetState);
