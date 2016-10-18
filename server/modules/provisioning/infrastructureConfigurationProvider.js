/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let assert = require('assert');
let co = require('co');
let ConfigurationError = require('modules/errors/ConfigurationError.class');
let DynamoItemNotFoundError = require('modules/errors/DynamoItemNotFoundError.class');
let config = require('config');
let sender = require('modules/sender');
let imageProvider = require('modules/provisioning/launchConfiguration/imageProvider');
let Environment = require('models/Environment');
let EnvironmentType = require('models/EnvironmentType');

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
        image,
      };
      return Promise.resolve(configuration);
    });
  },
};

function getServiceByName(serviceName) {
  const masterAccountName = config.getUserValue('masterAccountName');

  let query = {
    name: 'ScanDynamoResources',
    resource: 'config/services',
    accountName: masterAccountName,
    filter: {
      ServiceName: serviceName,
    },
  };

  return sender
    .sendQuery({ query })
    .then(
      services => services.length ?
      Promise.resolve(services[0].Value) :
      Promise.reject(new ConfigurationError(`Service "${serviceName}" not found.`)),
      error => Promise.reject(
        new Error(`An error has occurred retrieving "${serviceName}" service: ${error.message}`)
      )
    );
}

function getClusterByName(clusterName) {
  const masterAccountName = config.getUserValue('masterAccountName');

  let query = {
    name: 'GetDynamoResource',
    resource: 'config/clusters',
    accountName: masterAccountName,
    key: clusterName,
  };

  return sender
    .sendQuery({ query })
    .then(
      cluster => Promise.resolve({
        Name: cluster.ClusterName,
        ShortName: cluster.Value.ShortName,
        KeyPair: cluster.Value.KeyPair,
      }),
      error => Promise.reject(error instanceof DynamoItemNotFoundError ?
        new ConfigurationError(`Cluster "${clusterName}" not found.`) :
        new Error(`An error has occurred retrieving "${clusterName}" cluster: ${error.message}`)
      ));
}
