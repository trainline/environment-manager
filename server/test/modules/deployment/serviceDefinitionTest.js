/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');

let DeploymentContract = require('../../../modules/deployment/DeploymentContract');
let serviceDefinition = require('../../../modules/deployment/serviceDefinition');

describe('ServiceDefinitionKeyValueProvider:', () => {

  context('when deploying MyService service', () => {

    var deployment = new DeploymentContract({
      id: '00000000-0000-0000-0000-000000000001',
      environmentName: 'pr1',
      environmentTypeName: 'Prod',
      serverRole: 'Web',
      serverRoleName: 'Web',
      serviceName: 'MyService',
      serviceVersion: '1.2.3',
      serviceSlice: 'none',
      servicePortConfig: {
        blue: 1234,
        green: 9876
      },
      clusterName: 'Tango',
      accountName: 'Prod',
      username: 'test-user',
    });

    var promise = null;

    before(() => promise = serviceDefinition.getKeyValue(deployment));

    it('it should be possible to get a key/value pair', () =>

      promise.then(serviceDefinition => {

        should(serviceDefinition).not.be.undefined();
        should(serviceDefinition.key).not.be.undefined();
        should(serviceDefinition.value).not.be.undefined();

      })

    );

    it('key should contain environment name, service name and service version', () =>

      promise.then(serviceDefinition => {
        serviceDefinition.key.should.be.equal('environments/pr1/services/MyService/1.2.3/definition');
      })

    );

    it('value should contain a Consul specific service definition', () =>

      promise.then(serviceDefinition => {

        serviceDefinition.value.should.match({
          Service: {
            Name: 'pr1-MyService',
            ID: 'pr1-MyService',
            Address: '',
            Ports: { blue: 1234, green: 9876 },
            Tags: [
              'environment_type:Prod',
              'environment:pr1',
              'owning_cluster:Tango',
              'version:1.2.3',
            ],
          },
        });

      })

    );

  });

  context('when deploying blue version of MyService service to a multitenancy server role', () => {

    var deployment = new DeploymentContract({
      id: '00000000-0000-0000-0000-000000000001',
      environmentName: 'pr1',
      environmentTypeName: 'Prod',
      serverRole: 'Web',
      serverRoleName: 'Web',
      serviceName: 'MyService',
      serviceVersion: '1.2.3',
      serviceSlice: 'blue',
      servicePortConfig: { blue: 1234, green: 9876 },
      clusterName: 'Tango',
      accountName: 'Prod',
      username: 'test-user',
    });

    var promise = null;

    before(() => promise = serviceDefinition.getKeyValue(deployment));

    it("Service definition 'Name' and 'Id' should expose the slice name", () =>

      promise.then(serviceDefinition => {

        serviceDefinition.value.should.match({
          Service: {
            Name: 'pr1-MyService-blue',
            ID: 'pr1-MyService-blue',
            Address: '',
            Ports: { blue: 1234, green: 9876 },
            Tags: [
              'environment_type:Prod',
              'environment:pr1',
              'owning_cluster:Tango',
              'version:1.2.3',
            ],
          },
        });

      })

    );

  });

  context('when deploying blue version of MyService service to the blue slice of my server role', () => {

    var deployment = new DeploymentContract({
      id: '00000000-0000-0000-0000-000000000001',
      environmentName: 'pr1',
      environmentTypeName: 'Prod',
      serverRole: 'Web-blue',
      serverRoleName: 'Web',
      serviceName: 'MyService',
      serviceVersion: '1.2.3',
      servicePortConfig: { blue: 1234, green: 9876 },
      serviceSlice: 'blue',
      clusterName: 'Tango',
      accountName: 'Prod',
      username: 'test-user',
    });

    var promise = null;

    before(() => promise = serviceDefinition.getKeyValue(deployment));

    it("Service definition 'server_role' tag should match the server role in the deployment", () =>

      promise.then(serviceDefinition => {

        serviceDefinition.value.should.match({
          Service: {
            Name: 'pr1-MyService-blue',
            ID: 'pr1-MyService-blue',
            Address: '',
            Ports: { blue: 1234, green: 9876 },
            Tags: [
              'environment_type:Prod',
              'environment:pr1',
              'owning_cluster:Tango',
              'version:1.2.3',
            ],
          },
        });

      })

    );

  });

});

