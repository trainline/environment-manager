/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const rewire = require('rewire');
const assert = require('assert');
const sinon = require('sinon');

const randInt = n => Math.round(Math.random() * n);
const randSlice = _ => Math.round(Math.random()) ? 'blue' : 'green'; // eslint-disable-line no-confusing-arrow
const randStr = n => [...Array(n)].map(_ => String.fromCharCode(Math.round(Math.random() * 25) + 97)).join('');

describe('getInstanceState', function () {
  let sut;
  let serviceDiscovery;
  let serviceTargets;
  let targetStates = [];
  let currentStates = [];

  function setup() {
    serviceDiscovery = {
      getNodeHealth: sinon.stub().returns(Promise.resolve({})),
      getNode: sinon.stub().returns(Promise.resolve({
        Services: currentStates
      }))
    };
    serviceTargets = {
      getAllServiceTargets: sinon.stub().returns(Promise.resolve(targetStates)),
      getInstanceServiceDeploymentInfo: sinon.stub().returns(Promise.resolve({ Status: 'Success' })),
      getServiceDeploymentCause: sinon.stub().returns(Promise.resolve('Test'))
    };

    sut = rewire('modules/environment-state/getInstanceState');
    sut.__set__({ serviceDiscovery, serviceTargets }); // eslint-disable-line no-underscore-dangle
  }

  describe('all services installable', function () {
    before(() => {
      targetStates = [];
      currentStates = [];
      createServiceStates(targetStates, currentStates, 10);
      setup();
    });

    it('should be included in results', () => {
      return sut().then((result) => {
        assert.ok(result.Services.length !== 0);
        assert.equal(result.Services.length, currentStates.length);
      });
    });
  });

  describe('ignored services', function () {
    const N_INSTALLED = 87;
    const N_IGNORED = 43;

    before(() => {
      targetStates = [];
      currentStates = [];
      createServiceStates(targetStates, currentStates, N_INSTALLED);
      createServiceStates(targetStates, currentStates, N_IGNORED, false);
      setup();
    });

    it('should not be included in results', () => {
      return sut().then((result) => {
        assert.ok(result.Services.length !== 0);
        assert.equal(result.Services.length, N_INSTALLED);
      });
    });
  });
});

function createServiceStates(targetState, currentState, n, install = true) {
  return [...Array(n)].map(_ => createServiceStatePairs(targetState, currentState, install));
}

function createServiceStatePairs(targetState, currentState, install = true) {
  const serviceVersion = `${randInt(10)}.${randInt(100)}.${randInt(1000)}`;
  const serviceSlice = `${randSlice()}`;
  const serviceName = `${randStr(22)}`;
  const consulServiceName = `${randStr(2)}-${serviceName}`;
  const owningCluster = `${randStr(22)}`;
  const serverRole = `${randStr(1)}${randInt(99)}-${randStr(2)}-${randStr(12)}`;
  const deploymentId = `${randStr(8)}-${randStr(8)}-${randStr(8)}-${randStr(8)}`;

  let targetService = {
    Name: serviceName,
    DeploymentId: deploymentId,
    Slice: serviceSlice,
    Action: install ? 'Install' : 'Ignore'
  };

  let currentService = {
    Name: serviceName,
    Service: consulServiceName,
    Tags: [
      `version:${serviceVersion}`,
      `slice:${serviceSlice}`,
      `owning_cluster:${owningCluster}`,
      `server_role:${serverRole}`
    ]
  };

  targetState.push(targetService);

  if (install) {
    currentState.push(currentService);
  }
}
