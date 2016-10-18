/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assertContract = require('modules/assertContract');
let S3PathContract = require('modules/deployment/S3PathContract');
let DeploymentContract = require('modules/deployment/DeploymentContract');
let configCache = require('modules/configurationCache');

module.exports = function PackagePathProvider() {
  this.getS3Path = function (deployment) {
    assertContract(deployment, 'deployment', { type: DeploymentContract });

    return configCache
      .getEnvironmentTypeByName(deployment.environmentTypeName)
      .then((environmentType) => {
        let filePath = `${deployment.environmentName}/${deployment.serviceName}`;
        let fileName = `${deployment.serviceName}-${deployment.serviceVersion}.zip`;

        return Promise.resolve(new S3PathContract({
          bucket: environmentType.DeploymentBucket,
          key: `${filePath}/${fileName}`,
        }));
      });
  };
};
