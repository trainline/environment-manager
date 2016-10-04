/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let update = require('./UpdateTargetState');
let getTargetState = require('queryHandlers/services/GetTargetState');

function* DisableTargetState(command) {
  let environment = command.environment;
  let service = command.service;
  let serverRole = command.serverRole;
  let slice = command.slice;
  let key = `environments/${environment}/roles/${serverRole}/services/${service}/${slice}`;
  let recurse = true;
  let name = 'GetTargetState';

  let currentState = yield getTargetState({ key, recurse, environment, name });
  return currentState;
};

module.exports = co.wrap(DisableTargetState);
