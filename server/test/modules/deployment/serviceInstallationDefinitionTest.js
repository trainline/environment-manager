/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let DeploymentContract = require('modules/deployment/DeploymentContract');
let S3PathContract = require('modules/deployment/S3PathContract');
let serviceInstallationDefinition = require('modules/deployment/serviceInstallationDefinition');

describe('ServiceInstallationKeyValueProvider', () => {
  let serviceName = 'MyService';
  let serviceVersion = '1.2.3';
  let environmentName = 'pr';
  let environmentTypeName = 'Prod';
  let id = '00000000-0000-0000-0000-000000000001';
  let serverRole = 'Web';
  let serverRoleName = 'Web';
  let serviceSlice = '';
  let clusterName = 'Tango';
  let accountName = 'Prod';
  let username = 'test-user';
  let bucket = 'tl-deployment-prod';
  let key = 'Tango/MyService.zip';

  let deployment;
  let s3Path;

  beforeEach(() => {
    deployment = new DeploymentContract({
      id,
      environmentName,
      environmentTypeName,
      serverRole,
      serverRoleName,
      serviceName,
      serviceVersion,
      serviceSlice,
      clusterName,
      accountName,
      username
    });

    s3Path = new S3PathContract({
      bucket,
      key,
    });
  });


  it('constructs the correct URL key', () => {
    return serviceInstallationDefinition.getKeyValue(deployment, s3Path).then(serviceInstallation => {
      serviceInstallation.key.should.be.equal(`environments/${environmentName}/services/${serviceName}/${serviceVersion}/installation`);
    });
  });


  it('configures bucket, key and timeout values', () => {
    return serviceInstallationDefinition.getKeyValue(deployment, s3Path).then(serviceInstallation => {
      serviceInstallation.value.should.match({
        PackageBucket: bucket,
        PackageKey: key,
        InstallationTimeout: 20,
      });
    });
  });
});

