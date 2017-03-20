/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

function getKeyValue(deployment, s3Path) {
  let environmentName = deployment.environmentName;
  let serviceName = deployment.serviceName;
  let serviceVersion = deployment.serviceVersion;

  let serviceInstallationKeyValue = {
    key: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/installation`,
    value: {
      PackageBucket: s3Path.bucket,
      PackageKey: s3Path.key,
      InstallationTimeout: 20 // Todo: Should be read from the service definition
    }
  };

  return Promise.resolve(serviceInstallationKeyValue);
}

module.exports = {
  getKeyValue
};
