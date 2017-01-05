/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let serviceTargets = require('modules/service-targets');
let schema = require('modules/schema/schema');

module.exports = function GetTargetState(query) {
  return co(function* () {
    yield schema('GetTargetStateQuery').then(x => x.conform(query));

    let key = query.key;
    let recurse = query.recurse;

    return yield serviceTargets.getTargetState(query.environment, { key, recurse });
  });
};
