/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');

let DeploymentContract = require('modules/deployment/DeploymentContract');
let ServerRoleDefinitionKeyValueProvider = require('modules/deployment/ServerRoleDefinitionKeyValueProvider.class');

describe('ServerRoleDefinitionKeyValueProvider:', () => {

  context('given a deployment', () => {

    it('Should be possible to get the server role definition', () => {

      // Arrange
      var deployment = new DeploymentContract({
        id: '00000000-0000-0000-0000-000000000001',
        environmentName: 'pr1',
        serviceName: 'MyService',
        environmentTypeName: 'Prod',
        serverRole: 'Web',
        serverRoleName: 'Web',
        serviceVersion: '1.2.3',
        serviceSlice: '',
        clusterName: 'Tango',
        accountName: 'Prod',
        username: 'test-user',
      });

      // Act
      var target = new ServerRoleDefinitionKeyValueProvider();
      var promise = target.get(deployment);

      // Assert
      return promise.then(serverRoleDefinition => {

        should(serverRoleDefinition).not.be.undefined();

        serverRoleDefinition.key.should.be.equal('environments/pr1/roles/Web/services/MyService');

        serverRoleDefinition.value.should.match({
          Name: 'MyService',
          Version: '1.2.3',
          Slice: 'none',
          DeploymentId: '00000000-0000-0000-0000-000000000001',
          InstanceIds: [],
        });

      });

    });

  });

  context('given a blue deployment', () => {

    it('Should be possible to get the server role definition per slice', () => {

      // Arrange
      var deployment = new DeploymentContract({
        id: '00000000-0000-0000-0000-000000000001',
        environmentName: 'pr1',
        environmentTypeName: 'Prod',
        serverRole: 'Web',
        serverRoleName: 'Web',
        serviceName: 'MyService',
        serviceVersion: '1.2.3',
        serviceSlice: 'blue',
        clusterName: 'Tango',
        accountName: 'Prod',
        username: 'test-user',
      });

      // Act
      var target = new ServerRoleDefinitionKeyValueProvider();
      var promise = target.get(deployment);

      // Assert
      return promise.then(serverRoleDefinition => {

        should(serverRoleDefinition).not.be.undefined();

        serverRoleDefinition.key.should.be.equal('environments/pr1/roles/Web/services/MyService/blue');

        serverRoleDefinition.value.should.match({
          Name: 'MyService',
          Version: '1.2.3',
          Slice: 'blue',
          DeploymentId: '00000000-0000-0000-0000-000000000001',
          InstanceIds: [],
        });

      });

    });

  });

  context('given a blue deployment targeted to the blue server slice', () => {

    it('Should be possible to get the server role definition per slice', () => {

      // Arrange
      var deployment = new DeploymentContract({
        id: '00000000-0000-0000-0000-000000000001',
        environmentName: 'pr1',
        environmentTypeName: 'Prod',
        serverRole: 'Web-blue',
        serverRoleName: 'Web',
        serviceName: 'MyService',
        serviceVersion: '1.2.3',
        serviceSlice: 'blue',
        clusterName: 'Tango',
        accountName: 'Prod',
        username: 'test-user',
      });

      // Act
      var target = new ServerRoleDefinitionKeyValueProvider();
      var promise = target.get(deployment);

      // Assert
      return promise.then(serverRoleDefinition => {

        should(serverRoleDefinition).not.be.undefined();

        serverRoleDefinition.key.should.be.equal('environments/pr1/roles/Web-blue/services/MyService/blue');

        serverRoleDefinition.value.should.match({
          Name: 'MyService',
          Version: '1.2.3',
          Slice: 'blue',
          DeploymentId: '00000000-0000-0000-0000-000000000001',
          InstanceIds: [],
        });

      });

    });

  });

});
