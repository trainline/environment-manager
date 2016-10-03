/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let consulCatalog = require('./consulCatalog');

// TODO(filip): keyValueStore will have to be moved? keyValueStore is used as part of read-state, not definition
let keyValueStore = require('modules/service-targets/consul/keyValueStore');
let _ = require('lodash');

module.exports = {
  getAllServices: consulCatalog.getAllServices,
  getService: consulCatalog.getService,
  getAllNodes: consulCatalog.getAllNodes,
  getNode: consulCatalog.getNode,
  getNodeHealth: consulCatalog.getNodeHealth,
  getServiceDeploymentCause: function (environmentName, deploymentId, instanceId) {
    let key = `deployments/${deploymentId}/nodes/${instanceId}`;
    return keyValueStore.getTargetState(environmentName, { key, recurse: true }).then(function (data) {
      if (_.has(data, '[0].value.Cause')) {
        return _.get(data, '[0].value.Cause');
      } else {
        return 'Unknown';
      }
    });
  },
  /**
   * Source of services list is in Roles definition
   */
  getServicesList: function (environmentName, runtimeServerRole) {
    let key = `environments/${environmentName}/roles/${runtimeServerRole}/services`;
    return keyValueStore.getTargetState(environmentName, { key, recurse: true }).then(function (data) {
      return _.map(data, 'value')
    });
  }
};
