/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let BlueGreenDeploymentValidator = require('modules/deployment/validators/blueGreenDeploymentValidator');
let DeploymentContract = require('modules/deployment/DeploymentContract');
let DeploymentValidationError = require('modules/errors/DeploymentValidationError.class');

describe('BlueGreenDeploymentValidator:', () => {

  const serviceName = 'MyService';

  context('when configuration expects two different AutoScalingGroup for each slice', () => {

    var configuration = {
      serverRole: {
        FleetPerSlice: true,
      },
    };

    it('should be possible to consider a deployment valid when it exposes the service slice', () => {

      // Arrange
      var deployment = new DeploymentContract({
        id: '00000000-0000-0000-0000-000000000001',
        environmentName: 'pr1',
        environmentTypeName: 'Prod',
        serverRole: 'Web',
        serverRoleName: 'Web',
        serviceName: serviceName,
        serviceVersion: '1.0.0',
        serviceSlice: 'blue',
        clusterName: 'Tango',
        accountName: 'Prod',
        username: 'test-user',
      });

      // Act
      var target = BlueGreenDeploymentValidator;
      var promise = target.validate(deployment, configuration);

      // Assert
      return promise;

    });

    it("should not be possible to consider a deployment valid when service slice is not 'blue' or 'green'", () => {

      // Arrange
      var deployment = new DeploymentContract({
        id: '00000000-0000-0000-0000-000000000001',
        environmentName: 'pr1',
        environmentTypeName: 'Prod',
        serverRole: 'Web',
        serverRoleName: 'Web',
        serviceName: serviceName,
        serviceVersion: '1.0.0',
        serviceSlice: '',
        clusterName: 'Tango',
        accountName: 'Prod',
        username: 'test-user',
      });

      // Act
      var target = BlueGreenDeploymentValidator;
      var promise = target.validate(deployment, configuration);

      // Assert
      return promise.then(
        () => Promise.reject('Deployment should not be considered valid'),
        (error) => {
          should(error).be.instanceof(DeploymentValidationError);
          should(error.message).be.equal(
            `Server role configuration expects two AutoScalingGroups for '${serviceName}' blue/green slices but current deployment slice is empty.`
          );
        });

    });

  });

});
