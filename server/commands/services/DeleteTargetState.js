/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let resourceProvider = require('modules/resourceProvider');
let serviceTargets = require('modules/service-targets');
let schema = require('modules/schema/schema');

module.exports = function DeleteTargetState(command) {
  return co(function* () {
    yield schema('DeleteTargetStateCommand').then(x => x.conform(command));

    let key = command.key;
    return yield serviceTargets.removeTargetState(command.environment, { key });
  });
};
