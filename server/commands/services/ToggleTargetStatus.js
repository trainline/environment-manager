/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let serviceTargets = require('modules/service-targets');
let Enums = require('Enums');

const SERVICE_ACTION = Enums.serviceAction.NAME;
const SERVICE_INSTALL = Enums.serviceAction.INSTALL;
const SERVICE_IGNORE = Enums.serviceAction.IGNORE;

function* ToggleTargetStatus(command) {
  let environment = command.environment;
  let serviceName = command.service;
  let serverRole = command.serverRole;
  let slice = command.slice;
  let enabled = command.enable;
  let key = `environments/${environment}/roles/${serverRole}/services/${serviceName}/${slice}`;
  let state = yield serviceTargets.getTargetState(environment, { key });
  let service = state.value;
  let previousStatus = service.hasOwnProperty(SERVICE_ACTION) ? service[SERVICE_ACTION] : SERVICE_INSTALL;

  service[SERVICE_ACTION] = enabled ? SERVICE_INSTALL : SERVICE_IGNORE;

  try {
    let result = yield serviceTargets.setTargetState(environment, { key, value:service });
    return service;
  } catch (error) {
    throw new Error(
      `There was a problem updating the future installation status for ${serviceName}. Its status is still currently set to ${previousStatus}`);
  }
}

module.exports = co.wrap(ToggleTargetStatus);
