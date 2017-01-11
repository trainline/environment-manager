/* eslint-env mocha */
/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let should = require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');
let DeploymentContract = require('modules/deployment/DeploymentContract');

function validator(sender) {
  return proxyquire('modules/deployment/validators/uniqueServiceVersionDeploymentValidator', {
    'modules/sender': sender,
  });
}

describe('UniqueServiceVersionDeploymentValidator: ', function () {
  let environmentName = 'pr1';
  let serviceName = 'MyService';
  let serviceVersion = '1.0.0';
  let id = '00000000-0000-0000-0000-000000000001';
  let environmentTypeName = 'Prod';
  let serverRole = 'Web-blue';
  let serverRoleName = 'Web';
  let serviceSlice = 'blue';
  let clusterName = 'Tango';
  let accountName = 'Prod';
  let username = 'test-user';

  let configuration = {};
  let deployment = new DeploymentContract({
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
    username,
  });

  let cannedBlueGreenResponse = slice => [
    {
      key: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/definition`,
      value: {
        Service: {
          Name: `${environmentName}-${serviceName}-${serviceSlice}`,
          ID: `${environmentName}-${serviceName}-${serviceSlice}`,
          Address: '',
          Port: 0,
          Tags: [
            `environment_type:${environmentTypeName}`,
            `environment:${environmentName}`,
            `owning_cluster:${clusterName}`,
            `server_role:${serverRole}`,
            `version:${serviceVersion}`,
            `slice:${slice}`,
          ],
        },
      },
    },
  ];

  let cannedSingleSliceResponse = [
    {
      key: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/definition`,
      value: {
        Service: {
          Name: `${environmentName}-${serviceName}`,
          ID: `${environmentName}-${serviceName}`,
          Address: '',
          Port: 0,
          Tags: [
            `environment_type:${environmentTypeName}`,
            `environment:${environmentName}`,
            `owning_cluster:${clusterName}`,
            `server_role:${serverRole}`,
            `version:${serviceVersion}`,
            'slice:none',
          ],
        },
      },
    },
  ];

  let senderMock;

  describe('validating any deployment', function () {
    let sut;

    beforeEach(() => {
      senderMock = { sendQuery: sinon.stub().returns(Promise.resolve([])) };
      sut = validator(senderMock);
    });

    it('sends a query', () => {
      return sut.validate(deployment, configuration).then(() => {
        senderMock.sendQuery.called.should.be.true();
      });
    });

    it('queries the running deployments', () => {
      return sut.validate(deployment, configuration).then(() => {
        senderMock.sendQuery.getCall(0).args[0].should.match({
          query: {
            name: 'ScanCrossAccountDynamoResources',
            resource: 'deployments/history',
            filter: {
              'Value.EnvironmentName': environmentName,
              'Value.SchemaVersion': 2,
              'Value.ServiceName': serviceName,
              'Value.Status': 'In Progress',
            },
          },
        });
      });
    });

    it('queries the deployed services', () => {
      return sut.validate(deployment, configuration)
        .then(() =>
          senderMock.sendQuery.calledWithMatch({
            query: {
              name: 'GetTargetState',
              environment: environmentName,
              recurse: true,
              key: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/definition`,
            },
          })
        ).should.finally.be.true();
    });

    it('fails when the service is being deployed', () => {
      senderMock.sendQuery = () => Promise.resolve([undefined]);
      return sut.validate(deployment, configuration).catch((result) => {
        result.should.match({
          name: 'DeploymentValidationError',
          message: `The '${serviceName}' service is already being deployed to '${serverRoleName}' at this time.`,
        });
      });
    });
  });

  describe('validating a blue/green deployment', function () {

    function mockSender(createResponse) {
      function sendQuery(query) {
        if (query.query.name === 'ScanCrossAccountDynamoResources') {
          return Promise.resolve([]);
        }
        return createResponse(query);
      }
      return { sendQuery };
    }

    it('succeeds when the version of the service is not deployed', function () {
      let sender = mockSender(() => Promise.resolve([]));
      let sut = validator(sender);
      return sut.validate(deployment, configuration).should.be.fulfilled();
    });

    it('succeeds when the same version of the same service is deployed to the same slice', function () {
      let sender = mockSender(() => Promise.resolve(cannedBlueGreenResponse(serviceSlice)));
      let sut = validator(sender);
      return sut.validate(deployment, configuration).should.be.fulfilled();
    });

  });
});
