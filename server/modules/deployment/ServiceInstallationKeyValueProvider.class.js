/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assertContract = require('modules/assertContract');
let S3PathContract = require('modules/deployment/S3PathContract');
let DeploymentContract = require('modules/deployment/DeploymentContract');

module.exports = function ServiceInstallationKeyValueProvider() {
  this.get = function (deployment, s3Path) {

    assertContract(deployment, 'deployment', { type: DeploymentContract, null: false });
    assertContract(s3Path, 's3Path', { type: S3PathContract, null: false });

    var environmentName = deployment.environmentName;
    var serviceName = deployment.serviceName;
    var serviceVersion = deployment.serviceVersion;

    var serviceInstallationKeyValue = {
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
