/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let update = require('./UpdateTargetState');
let getTargetState = require('queryHandlers/services/GetTargetState');

module.exports = function DisableTargetState(command) {
  let environment = command.environment;
  let service = command.service;
  let serverRole = command.serverRole;
  let slice = command.slice;
  let key = `environments/${environment}/roles/${serverRole}/services/${service}/${slice}`;
  let recurse = true;
  let name = 'GetTargetState';

  return getTargetState({ key, recurse, environment, name });
};
