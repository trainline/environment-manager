/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let Enums = require('Enums');
let co = require('co');
let serviceDiscovery = require('modules/service-discovery');
let GetServerRoles = require('queryHandlers/services/GetServerRoles');
let getASGState = require('./getASGState');
let AutoScalingGroup = require('models/AutoScalingGroup');

function* getServiceHealth({ environmentName, serviceName }) {
  let service = yield serviceDiscovery.getService(environmentName, serviceName);
  let serviceRoles = (yield GetServerRoles({ environmentName })).Value;
  _.each(serviceRoles, (role) => {
    role.Services = _.filter(role.Services, { Name: serviceName });
  });

  // Remove from the list roles that don't contain requested service
  serviceRoles = _.filter(serviceRoles, (role) => _.isEmpty(role.Services) === false);

  let list = [];
  for (let role of serviceRoles) {
    let autoScalingGroups = yield AutoScalingGroup.getAllByServerRoleName(environmentName, role.Role);
    let state;

    for (let asg of autoScalingGroups) {
      try {
        state = yield getASGState(environmentName, asg.AutoScalingGroupName);
      } catch (error) {
        // If AutoScalingGroup is not found (old consul data), don't include it in the results
        if (error.name === 'AutoScalingGroupNotFoundError') {
          state = 'not found ' + asg.AutoScalingGroupName;
          // continue;
        } else {
          throw error;
        }
      }
      let instances = _.filter(state.Instances, (instance) => _.some(instance.Services, { Name: serviceName }));
      let services = _.filter(state.Services, { Name: serviceName });

      // Filter services on instances info to return only queried service
      _.each(instances, (instance) => {
        instance.Services = _.filter(instance.Services, { Name: serviceName });
      });
      list.push({
        AutoScalingGroupName: asg.AutoScalingGroupName,
        Services: services,
        Instances: instances
      });
    }
  }

  return list;
}

module.exports = co.wrap(getServiceHealth);