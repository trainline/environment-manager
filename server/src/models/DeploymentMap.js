/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let ResourceNotFoundError = require('../modules/errors/ResourceNotFoundError.class');
let deploymentMaps = require('../modules/data-access/deploymentMaps');

class DeploymentMap {

  constructor(data) {
    _.assign(this, data);
  }

  static getByName(deploymentMapName) {
    return deploymentMaps.get({ DeploymentMapName: deploymentMapName })
      .then(deploymentMap => (deploymentMap !== null
        ? new DeploymentMap(deploymentMap.Value)
        : Promise.reject(new ResourceNotFoundError(`Deployment map "${deploymentMapName}" not found.`))),
        error => Promise.reject(
          new Error(`An error has occurred retrieving "${deploymentMapName}" deployment map: ${error.message}`)));
  }

  getServerRolesByServiceName(serviceName) {
    let deploymentTargets = this.DeploymentTarget.filter(target =>
      target.Services.some(service => service.ServiceName === serviceName)
    );

    if (deploymentTargets.length === 0) {
      throw new ResourceNotFoundError(
        `Target server role cannot be identified through "${serviceName}" service because there ` +
        'is no reference to it in the deployment map.'
      );
    }

    return deploymentTargets;
  }

}

module.exports = DeploymentMap;
