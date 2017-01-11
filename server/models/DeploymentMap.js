/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let config = require('config');
let sender = require('modules/sender');
let ConfigurationError = require('modules/errors/ConfigurationError.class');
let DynamoItemNotFoundError = require('modules/errors/DynamoItemNotFoundError.class');

class DeploymentMap {

  constructor(data) {
    _.assign(this, data);
  }

  static getByName(deploymentMapName) {
    const masterAccountName = config.getUserValue('masterAccountName');

    let query = {
      name: 'GetDynamoResource',
      resource: 'config/deploymentmaps',
      accountName: masterAccountName,
      key: deploymentMapName
    };

    return sender
      .sendQuery({ query })
      .then(
        deploymentMap => new DeploymentMap(deploymentMap.Value),
        error => Promise.reject(error instanceof DynamoItemNotFoundError ?
          new ConfigurationError(`Deployment map "${deploymentMapName}" not found.`) :
          new Error(`An error has occurred retrieving "${deploymentMapName}" deployment map: ${error.message}`)
        ));
  }

  getServerRolesByServiceName(serviceName) {
    let deploymentTargets = this.DeploymentTarget.filter(target =>
      target.Services.some(service => service.ServiceName === serviceName)
    );

    if (deploymentTargets.length === 0) {
      throw new ConfigurationError(
        `Target server role cannot be identified through "${serviceName}" service because there ` +
        'is no reference to it in the deployment map.'
      );
    }

    return deploymentTargets;
  }

}

module.exports = DeploymentMap;
