/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let serviceTargets = require('modules/service-targets');
let _ = require('lodash');
let { createServerRoleFilter } = require('modules/environment-state/serverRoleFilters');

function toRoleGroups(results) {
  let hash = _.groupBy(results, getRole);
  return Object.keys(hash).map(key => (
    {
      Role: key,
      Services: _.map(hash[key], 'value')
    }
  ));
}

function getRole(service) {
  let r = /roles\/(.*?)\//;
  let matches = r.exec(service.key);
  return matches[1];
}

function GetServerRoles({ environmentName, serviceName, slice, serverRole }) {
  let recurse = true;
  let key = `environments/${environmentName.toLowerCase()}/roles`;
  return serviceTargets.getTargetState(environmentName, { key, recurse })
    .then(results => ({
      EnvironmentName: environmentName,
      Value: toRoleGroups(results).filter(createServerRoleFilter({ serviceName, slice, serverRole }))
    }));
}

module.exports = GetServerRoles;
