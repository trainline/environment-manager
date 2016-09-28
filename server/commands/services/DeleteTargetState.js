/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let resourceProvider = require('modules/resourceProvider');
let serviceUpdater = require('modules/service-updater');
let schema = require('modules/schema/schema');

module.exports = function DeleteTargetState(command) {
  return co(function* () {
    yield schema('DeleteTargetStateCommand').then(x => x.conform(command));

    let key = command.key;
    return yield serviceUpdater.removeTargetState(command.environment, { key });
  });
};
