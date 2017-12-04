/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let serviceTargets = require('../../modules/service-targets');
let schema = require('../../modules/schema/schema');

module.exports = function DeleteTargetState(command) {
  return co(function* () {
    yield schema('DeleteTargetStateCommand').then(x => x.assert(command));

    let key = command.key;
    return yield serviceTargets.removeTargetState(command.environment, { key });
  });
};
