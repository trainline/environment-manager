/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let serviceTargets = require('modules/service-targets');

function* DisableTargetState(command) {
  let environment = command.environment;
  let serviceName = command.service;
  let serverRole = command.serverRole;
  let slice = command.slice;
  let key = `environments/${environment}/roles/${serverRole}/services/${serviceName}/${slice}`;

  let state = yield serviceTargets.getTargetState(environment, { key });
  let service = state.value;
  service.status = 'Disabled';
  return yield serviceTargets.setTargetState(environment, { key, value:service });
}

module.exports = co.wrap(DisableTargetState);
