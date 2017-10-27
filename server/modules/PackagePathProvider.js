/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let S3PathContract = require('./deployment/S3PathContract');
let configCache = require('./configurationCache');

module.exports = function PackagePathProvider() {
  this.getS3Path = function (deployment) {
    return configCache
      .getEnvironmentTypeByName(deployment.environmentTypeName)
      .then((environmentType) => {
        let filePath = `${deployment.environmentName}/${deployment.serviceName}`;
        let fileName = `${deployment.serviceName}-${deployment.serviceVersion}.zip`;

        return Promise.resolve(new S3PathContract({
          bucket: environmentType.DeploymentBucket,
          key: `${filePath}/${fileName}`
        }));
      });
  };
};
