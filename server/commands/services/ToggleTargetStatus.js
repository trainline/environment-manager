/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let serviceTargets = require('modules/service-targets');

function* ToggleTargetStatus(command) {
  let environment = command.environment;
  let serviceName = command.service;
  let serverRole = command.serverRole;
  let slice = command.slice;
  let enabled = command.enabled;
  let key = `environments/${environment}/roles/${serverRole}/services/${serviceName}/${slice}`;

  let state = yield serviceTargets.getTargetState(environment, { key });
  let service = state.value;

  if (service.hasOwnProperty('status')) {
    service.status = null;
    delete service.status;
  }
  service.Status = enabled ? 'Enabled': 'Disabled';

  try {
    let result = yield serviceTargets.setTargetState(environment, { key, value:service });
    return service;
  } catch (error) {
    throw new Error('There was an error updating the future Deployment Status.');
  }
}

module.exports = co.wrap(ToggleTargetStatus);
