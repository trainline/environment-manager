/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let serviceTargets = require('modules/service-targets');
let _ = require('lodash');
let co = require('co');

function toRoleGroups(results) {
  let hash = _.groupBy(results, getRole);
  return Object.keys(hash).map(key => (
    {
      Role: key,
      Services: _.map(hash[key], 'value'),
    }
  ));
}

function getRole(service) {
  let r = /roles\/(.*?)\//;
  let matches = r.exec(service.key);
  return matches[1];
}

function* GetServerRoles({ environmentName }) {
  let recurse = true;
  let key = `environments/${environmentName.toLowerCase()}/roles`;
  let results = yield serviceTargets.getTargetState(environmentName, { key, recurse });

  return {
    EnvironmentName: environmentName,
    Value: toRoleGroups(results),
  };
}

module.exports = co.wrap(GetServerRoles);
