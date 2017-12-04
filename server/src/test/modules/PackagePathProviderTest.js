/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let should = require('should');
let sinon = require('sinon');
let inject = require('inject-loader!../../modules/PackagePathProvider');

let S3PathContract = require('../../modules/deployment/S3PathContract');
let DeploymentContract = require('../../modules/deployment/DeploymentContract');

describe('PackagePathProvider:', () => {
  const ENVIRONMENT_NAME = 'pr1';
  const SERVICE_NAME = 'MyService';
  const SERVICE_VERSION = '1.2.3';

  it('should be possible to obtain S3 bucket and key by deployment', () => {
    // Arrange
    let deployment = new DeploymentContract({
      id: '00000000-0000-0000-0000-000000000001',
      environmentName: ENVIRONMENT_NAME,
      environmentTypeName: 'Prod',
      serverRole: 'Web',
      serverRoleName: 'Web',
      serviceName: SERVICE_NAME,
      serviceVersion: SERVICE_VERSION,
      serviceSlice: '',
      clusterName: 'Tango',
      accountName: 'Prod',
      username: 'test-user'
    });

    let expectedDeploymentBucket = 'code-deploy-bucket';

    let expectedEnvironmentType = {
      DeploymentBucket: expectedDeploymentBucket
    };

    let configCache = {
      getEnvironmentTypeByName: sinon.stub().returns(Promise.resolve(expectedEnvironmentType))
    };

    const Target = inject({ './configurationCache': configCache });

    // Act
    let target = new Target();
    let promise = target.getS3Path(deployment);

    // Assert
    return promise.then((s3Path) => {
      should(s3Path).not.be.undefined();
      should(s3Path).instanceOf(S3PathContract);

      s3Path.bucket.should.be.equal(expectedDeploymentBucket);
      s3Path.key.should.be.equal(`${ENVIRONMENT_NAME}/${SERVICE_NAME}/${SERVICE_NAME}-${SERVICE_VERSION}.zip`);

      configCache.getEnvironmentTypeByName.called.should.be.true();
      configCache.getEnvironmentTypeByName.getCall(0).args.should.match(
        [deployment.environmentTypeName]
      );
    });
  });
});

