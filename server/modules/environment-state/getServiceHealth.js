/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let Enums = require('Enums');
let co = require('co');
let GetServerRoles = require('queryHandlers/services/GetServerRoles');
let getASGState = require('./getASGState');
let AutoScalingGroup = require('models/AutoScalingGroup');

function* getServiceHealth({ environmentName, serviceName, slice, serverRole }) {
  let serviceRoles = (yield GetServerRoles({ environmentName })).Value;

  _.each(serviceRoles, (role) => {
    role.Services = _.filter(role.Services, { Name: serviceName });
  });
  // Remove from the list roles that don't contain requested service
  serviceRoles = _.filter(serviceRoles, role => _.isEmpty(role.Services) === false);

  if (serviceRoles.length > 1) {
    if (serverRole !== undefined) {
      let filterName = serverRole;
      if (slice !== 'none') {
        filterName += `-${slice}`;
      }
      serviceRoles = _.filter(serviceRoles, { Role: filterName });
    } else if (slice !== 'none') {
      serviceRoles = _.filter(serviceRoles, role => role.Role.endsWith(slice));
    } else {
      throw new Error(`Multiple roles found for ${slice} ${serviceName} in ${environmentName} ${serverRole}`);
    }
  }

  let role = serviceRoles[0];
  let autoScalingGroups = yield AutoScalingGroup.getAllByServerRoleName(environmentName, role.Role);

  for (let asg of autoScalingGroups) {
    let state = yield getASGState(environmentName, asg.AutoScalingGroupName);
    let services = _.filter(state.Services, { Name: serviceName, Slice: slice });

    if (services.length === 1) {
      let service = services[0];
      return {
        Name: service.Name,
        InstancesCount: service.InstancesCount,
        OverallHealth: service.OverallHealth,
        HealthChecks: service.HealthChecks,
        Slice: service.Slice
      };
    }
  }

  throw new Error(`Could not find ${slice} ${serviceName} in ${environmentName} ${serverRole}`);
}

module.exports = co.wrap(getServiceHealth);
