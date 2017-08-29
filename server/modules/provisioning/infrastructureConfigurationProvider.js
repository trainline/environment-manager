/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let assert = require('assert');
let co = require('co');
let ConfigurationError = require('modules/errors/ConfigurationError.class');
let DynamoItemNotFoundError = require('modules/errors/DynamoItemNotFoundError.class');
let imageProvider = require('modules/provisioning/launchConfiguration/imageProvider');
let Environment = require('models/Environment');
let EnvironmentType = require('models/EnvironmentType');
let clusters = require('modules/data-access/clusters');
let servicesDb = require('modules/data-access/services');

module.exports = {
  get(environmentName, serviceName, serverRoleName) {
    assert(environmentName, 'Expected \'environmentName\' argument not to be null or empty');
    assert(serviceName, 'Expected \'serviceName\' argument not to be null or empty');
    assert(serverRoleName, 'Expected \'serviceName\' argument not to be null or empty');

    return co(function* () {
      let environment = yield Environment.getByName(environmentName);
      let deploymentMap = yield environment.getDeploymentMap();
      let service = yield getServiceByName(serviceName);
      let environmentType = yield EnvironmentType.getByName(environment.EnvironmentType).catch(
        error => Promise.reject(new ConfigurationError(
          `An error has occurred retrieving environment "${environmentName}" environment type.`,
          error))
      );
      let serverRole = _.find(deploymentMap.DeploymentTarget, { ServerRoleName: serverRoleName });

      let cluster = yield getClusterByName(serverRole.OwningCluster);
      let image = yield imageProvider.get(serverRole.AMI);
      let configuration = {
        environmentTypeName: environment.EnvironmentType,
        environmentName,
        serviceName,
        environmentType,
        environment,
        serverRole,
        service,
        cluster,
        image
      };
      return Promise.resolve(configuration);
    });
  }
};

function getServiceByName(serviceName) {
  return servicesDb.get({ ServiceName: serviceName })
    .then(service =>
      (service ?
        Promise.resolve(service.Value) :
        Promise.reject(new ConfigurationError(`Service "${serviceName}" not found.`))))
    .catch((error) => {
      throw new Error(`An error has occurred retrieving "${serviceName}" service: ${error.message}`);
    });
}

function getClusterByName(clusterName) {
  return clusters.get({ ClusterName: clusterName })
    .then(
    cluster => Promise.resolve({
      Name: cluster.ClusterName,
      ShortName: cluster.Value.ShortName,
      KeyPair: cluster.Value.KeyPair
    }),
    error => Promise.reject(error instanceof DynamoItemNotFoundError ?
      new ConfigurationError(`Cluster "${clusterName}" not found.`) :
      new Error(`An error has occurred retrieving "${clusterName}" cluster: ${error.message}`)
    ));
}
