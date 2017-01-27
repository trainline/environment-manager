/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let Enums = require('Enums');
let HEALTH_STATUS = Enums.HEALTH_STATUS;
let co = require('co');
let GetServerRoles = require('queryHandlers/services/GetServerRoles');
let getASGState = require('./getASGState');
let AutoScalingGroup = require('models/AutoScalingGroup');

function* getServiceHealth({ environmentName, serviceName, slice, serverRole }) {
  let serviceRoles = (yield GetServerRoles({ environmentName })).Value;
  if (serverRole !== undefined) {
    serviceRoles = _.filter(serviceRoles, { Name: serverRole });
  }
  _.each(serviceRoles, (role) => {
    role.Services = _.filter(role.Services, { Name: serviceName });
  });
  // Remove from the list roles that don't contain requested service
  serviceRoles = _.filter(serviceRoles, role => _.isEmpty(role.Services) === false);

  if (slice === undefined) {
    return (yield co.wrap(getOverallHealth)(environmentName, serviceName, serviceRoles));
  } else {
    return (yield co.wrap(getIndividualHealth)(environmentName, serviceName, serviceRoles, slice));
  }
}

function* getIndividualHealth(environmentName, serviceName, serviceRoles, slice) {
  let list = [];

  for (let role of serviceRoles) {
    let autoScalingGroups = yield AutoScalingGroup.getAllByServerRoleName(environmentName, role.Role);
    let state;

    for (let asg of autoScalingGroups) {
      state = yield co.wrap(getAsgState)(asg, environmentName);
      let services = _.filter(state.Services, { Name: serviceName, Slice: slice }).map(s => ({
        Name: s.Name,
        InstanceCount: s.InstanceCount,
        OverallHealth: s.OverallHealth,
        HealthChecks: s.HealthChecks
      }));

      list.push({
        serverRole: role.Role,
        services
      });
    }
  }

  return list;
}

function* getOverallHealth(environmentName, serviceName, serviceRoles) {
  let list = [];

  for (let role of serviceRoles) {
    let autoScalingGroups = yield AutoScalingGroup.getAllByServerRoleName(environmentName, role.Role);
    let state;

    for (let asg of autoScalingGroups) {
      state = yield co.wrap(getAsgState)(asg, environmentName);
      let instances = _.filter(state.Instances, instance => _.some(instance.Services, { Name: serviceName }));
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

  function aggregateHealth(statusList) {
    if (_.every(statusList, { OverallHealth: HEALTH_STATUS.Healthy })) {
      return HEALTH_STATUS.Healthy;
    } else if (_.some(statusList, { OverallHealth: HEALTH_STATUS.Missing })) {
      return HEALTH_STATUS.Missing;
    } else if (_.some(statusList, { OverallHealth: HEALTH_STATUS.Error })) {
      return HEALTH_STATUS.Error;
    } else if (_.some(statusList, { OverallHealth: HEALTH_STATUS.Warning })) {
      return HEALTH_STATUS.Warning;
    } else {
      return HEALTH_STATUS.Unknown;
    }
  }

  _.each(list, (asg) => {
    asg.OverallHealth = aggregateHealth(asg.Services);
  });

  return {
    OverallHealth: aggregateHealth(list),
    AutoScalingGroups: list
  };
}

function* getAsgState(asg, environmentName) {
  try {
    yield getASGState(environmentName, asg.AutoScalingGroupName);
  } catch (error) {
    // If AutoScalingGroup is not found (old consul data), don't include it in the results
    if (error.name === 'AutoScalingGroupNotFoundError') {
      yield `not found ${asg.AutoScalingGroupName}`;
    } else {
      throw error;
    }
  }
}

module.exports = co.wrap(getServiceHealth);
