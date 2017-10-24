/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let Promise = require('bluebird');
let {
  assign,
  flatMap,
  flatten,
  isUndefined,
  map,
  matches,
  omitBy,
  pickBy,
  reduce,
  toPairs
} = require('lodash/fp');
let GetServerRoles = require('../../queryHandlers/services/GetServerRoles');
let AutoScalingGroup = require('../../models/AutoScalingGroup');
let serviceDiscovery = require('../service-discovery');
let { createEC2Client } = require('../amazon-client/childAccountClient');
let { fullyQualifiedServiceNamesFor } = require('./serverRoleFilters');
let {
  compare,
  currentState,
  desiredCountOf,
  desiredState,
  desiredTopologyOf,
  instancesOf,
  instancesRequestFor,
  summariseComparison } = require('./healthReporter');
let { getAccountNameForEnvironment } = require('../../models/Environment');

function getAutoScalingGroups(environmentQualifiedRoleNames) {
  return Promise.map(environmentQualifiedRoleNames,
    ({ environment, role }) => AutoScalingGroup.getAllByServerRoleName(environment, role))
    .then(flatten);
}

function getHealth(fullyQualifiedServiceNames) {
  return Promise.map(fullyQualifiedServiceNames, (fullyQualifiedServiceName) => {
    let [environment, service, slice] = fullyQualifiedServiceName.split('-');
    let sliceQualifiedServiceName = `${service}${slice ? `-${slice}` : ''}`;
    return serviceDiscovery.getServiceHealth(environment, sliceQualifiedServiceName);
  }).then(flatten);
}

function getInstances(instanceRequests) {
  let query = instances => ({
    Filters: [
      {
        Name: 'tag:Name',
        Values: instances
      }
    ]
  });
  return Promise.map(toPairs(instanceRequests), ([account, instances]) => {
    let filters = query(instances);
    return createEC2Client(account)
      .then(ec2 => ec2.describeInstances(filters).promise());
  }).then(flatten);
}

function getDesiredState(filters) {
  let rolesP = GetServerRoles(filters);
  let desiredTopologyP = rolesP
    .then(desiredTopologyOf)
    .then(pickBy(matches(omitBy(isUndefined)({
      environment: filters.environmentName,
      service: filters.serviceName,
      slice: filters.slice
    }))));
  let desiredCountsP = rolesP
    .then(({ EnvironmentName, Value }) => map(({ Role }) => ({ environment: EnvironmentName, role: Role }))(Value))
    .then(getAutoScalingGroups)
    .then(desiredCountOf);

  return Promise.join(desiredTopologyP, desiredCountsP, desiredState);
}

function getCurrentState(filters) {
  let fullyQualifiedServiceNames = fullyQualifiedServiceNamesFor(filters);
  let serviceHealthP = getHealth(fullyQualifiedServiceNames);
  let instancesP = serviceHealthP
    .then(serviceHealth => instancesRequestFor(getAccountNameForEnvironment, serviceHealth))
    .then(getInstances)
    .then(flatMap(instancesOf))
    .then(reduce(assign, {}));

  return Promise.join(serviceHealthP, instancesP, currentState);
}

function getServiceHealth(filters) {
  let currentStateP = getCurrentState(filters);
  let desiredStateP = getDesiredState(filters);

  function compareWithSummary(d, c) {
    let comparison = compare(d, c);
    return map(service => assign(summariseComparison(service))(service))(comparison);
  }

  return Promise.join(desiredStateP, currentStateP, compareWithSummary);
}

module.exports = getServiceHealth;
