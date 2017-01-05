/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let serviceTargets = require('modules/service-targets');
let Enums = require('Enums');

const SERVICE_INSTALL = Enums.ServiceAction.INSTALL;
const SERVICE_IGNORE = Enums.ServiceAction.IGNORE;

function* ToggleTargetStatus(command) {
  let environment = command.environment;
  let serviceName = command.service;
  let serverRole = command.serverRole;
  let slice = command.slice;
  let enabled = command.enable;
  let key = `environments/${environment}/roles/${serverRole}/services/${serviceName}/${slice}`;
  let state = yield serviceTargets.getTargetState(environment, { key });
  let service = state.value;
  let previousStatus = service['Action'] || SERVICE_INSTALL;

  service['Action'] = enabled ? SERVICE_INSTALL : SERVICE_IGNORE;

  try {
    let result = yield serviceTargets.setTargetState(environment, { key, value: service });
    return service;
  } catch (error) {
    throw new Error(
      `There was a problem updating the future installation status for ${serviceName}. Its status is still currently set to ${previousStatus}`);
  }
}

module.exports = co.wrap(ToggleTargetStatus);
