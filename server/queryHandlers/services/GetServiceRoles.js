/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let serviceTargets = require('modules/service-targets');
let _ = require('lodash');
let co = require('co');

function toRoleGroups(results) {
  console.log(JSON.stringify(results, null, 2));
  var hash = _.groupBy(results, getRole);
  return Object.keys(hash).map(key => {
    return {
      Role: key,
      Services: _.map(hash[key], 'value'),
    };
  });
}

function getRole(service) {
  var r = /roles\/(.*?)\//;
  var matches = r.exec(service.key);
  return matches[1];
}

function* GetServiceRolesQueryHandler(query) {
  let recurse = true;
  let key = `environments/${query.environmentName.toLowerCase()}/roles`;
  let results = yield serviceTargets.getTargetState(query.environmentName, { key, recurse });

  return {
    AccountName: query.accountName,
    EnvironmentName: query.environmentName,
    Value: toRoleGroups(results),
  };
};

module.exports = co.wrap(GetServiceRolesQueryHandler);
