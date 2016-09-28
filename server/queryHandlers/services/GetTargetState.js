/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let serviceUpdater = require('modules/service-updater');
let schema = require('modules/schema/schema');

module.exports = function GetTargetState(query) {
  return co(function* () {
    yield schema('GetTargetStateQuery').then(x => x.conform(query));

    let key = query.key;
    let recurse = query.recurse;

    return yield serviceUpdater.getTargetState(query.environment, { key, recurse });
  });
};
