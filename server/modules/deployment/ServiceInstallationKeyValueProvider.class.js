/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assertContract = require('modules/assertContract');
let S3PathContract = require('modules/deployment/S3PathContract');
let DeploymentContract = require('modules/deployment/DeploymentContract');

module.exports = function ServiceInstallationKeyValueProvider() {
  this.get = function (deployment, s3Path) {
    assertContract(deployment, 'deployment', { type: DeploymentContract, null: false });
    assertContract(s3Path, 's3Path', { type: S3PathContract, null: false });

    let environmentName = deployment.environmentName;
    let serviceName = deployment.serviceName;
    let serviceVersion = deployment.serviceVersion;

    let serviceInstallationKeyValue = {
      key: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/installation`,
      value: {
        PackageBucket: s3Path.bucket,
        PackageKey: s3Path.key,
        InstallationTimeout: 20, // Todo: Should be read from the service definition
      },
    };

    return Promise.resolve(serviceInstallationKeyValue);
  };
};
