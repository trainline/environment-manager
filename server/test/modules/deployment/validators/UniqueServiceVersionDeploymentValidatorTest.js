/* eslint-disable func-names */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

require('should');
let sinon = require('sinon');
let proxyquire = require('proxyquire');
let DeploymentContract = require('../../../../modules/deployment/DeploymentContract');

function validator(deployments, sender) {
  return proxyquire('../../../../modules/deployment/validators/uniqueServiceVersionDeploymentValidator', {
    '../../data-access/deployments': deployments || {},
    '../../sender': sender || { sendQuery: () => Promise.resolve([]) }
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
    username
  });

  let cannedBlueGreenResponse = slice => [
    {
      key: `environments/${environmentName}/services/${serviceName}/${serviceVersion}/definition`,
      value: {
        Service: {
          Name: `${environmentName}-${serviceName}-${slice}`,
          ID: `${environmentName}-${serviceName}-${slice}`,
          Address: '',
          Port: 0,
          Tags: [
            `environment_type:${environmentTypeName}`,
            `environment:${environmentName}`,
            `owning_cluster:${clusterName}`,
            `server_role:${serverRole}`,
            `version:${serviceVersion}`,
            `slice:${slice}`
          ]
        }
      }
    }
  ];

  describe('validating any deployment', function () {
    it('scans running deployments', () => {
      let deployments = { scanRunning: sinon.spy(x => Promise.resolve([])) };
      let sut = validator(deployments);
      return sut.validate(deployment, configuration).then(() => {
        deployments.scanRunning.called.should.be.true();
      });
    });

    it('scans the expected running deployments', () => {
      let deployments = { scanRunning: sinon.spy(x => Promise.resolve([])) };
      let sut = validator(deployments);
      return sut.validate(deployment, configuration).then(() => {
        deployments.scanRunning.getCall(0).args[0].should.match({
          FilterExpression: ['and',
            ['=', ['at', 'Value', 'EnvironmentName'], ['val', environmentName]],
            ['=', ['at', 'Value', 'SchemaVersion'], ['val', 2]],
            ['=', ['at', 'Value', 'ServiceName'], ['val', serviceName]],
            ['=', ['at', 'Value', 'Status'], ['val', 'In Progress']]
          ]
        });
      });
    });

    it('fails when the service is being deployed', () => {
      let deployments = { scanRunning: () => Promise.resolve([{}]) };
      let sut = validator(deployments);
      return sut.validate(deployment, configuration).catch((result) => {
        result.should.match({
          name: 'DeploymentValidationError',
          message: `The '${serviceName}' service is already being deployed to '${serverRoleName}' at this time.`
        });
      });
    });
  });

  describe('validating a blue/green deployment', function () {
    function mockSender(createResponse) {
      function sendQuery(query) {
        return createResponse(query);
      }
      return { sendQuery };
    }

    let deployments = { scanRunning: () => Promise.resolve([]) };

    it('succeeds when the version of the service is not deployed', function () {
      let sender = mockSender(() => Promise.resolve([]));
      let sut = validator(deployments, sender);
      return sut.validate(deployment, configuration).should.be.fulfilled();
    });

    it('succeeds when the same version of the same service is deployed to the same slice', function () {
      let sender = mockSender(() => Promise.resolve(cannedBlueGreenResponse(serviceSlice)));
      let sut = validator(deployments, sender);
      return sut.validate(deployment, configuration).should.be.fulfilled();
    });

    it('succeeds when the same version of the same service is deployed to different slices', function () {
      let sender = mockSender(() => Promise.resolve(cannedBlueGreenResponse('green')));
      let sut = validator(deployments, sender);
      return sut.validate(deployment, configuration).should.be.fulfilled();
    });
  });
});

