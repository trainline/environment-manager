/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const rewire = require('rewire');
const assert = require('assert');
const sinon = require('sinon');

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

  let SERVICE_STATES = [
    { Install: 87, Ignore: 43 },
    { Install: 0, Ignore: 0, Missing: 0 },
    { Install: 11, Ignore: 65, Missing: 12 },
    { Install: 99, Ignore: 99, Missing: 99 },
    { Install: 89, Missing: 76 },
    { Install: 0, Ignore: 0, Unexpected: 100 },
    { Install: 11, Ignore: 65, Unexpected: 12 },
    { Install: 99, Ignore: 99, Unexpected: 99 },
    { Install: 33, Ignore: 10, Missing: 20, Unexpected: 100 },
    { Install: 51, Ignore: 65, Missing: 90, Unexpected: 87 },
    { Install: 7, Ignore: 48, Missing: 4, Unexpected: 6 },
    { Unexpected: 117 },
    { Missing: 245 },
    { Ignore: 117 },
    { Install: 1 }
  ];

  describe('service states', function () {
    SERVICE_STATES.forEach(function (params) {
      const installed = params.Install || 0;
      const ignored = params.Ignore || 0;
      const missing = params.Missing || 0;
      const unexpected = params.Unexpected || 0;
      const missingOrUnexpected = missing + unexpected > 0;
      const expected = installed + missing + unexpected;

      describe(`with ${installed} installed, ${missing} missing, ${unexpected} unexpected and ${ignored} ignored`, function () {
        beforeEach(() => {
          targetStates = [];
          currentStates = [];
          Object.keys(params).forEach((key) => {
            createServiceStates(targetStates, currentStates, params[key], key);
          });
          setup();
        });

        it(`should return ${expected} services`, () => {
          return sut().then((result) => {
            assert.equal(result.Services.length, expected);
          });
        });

        it(`should ${missingOrUnexpected ? '' : 'not '}warn of missing or unexpected services`, () => {
          return sut().then((result) => {
            assert.equal(result.MissingOrUnexpectedServices, missingOrUnexpected);
          });
        });
      });
    });
  });
});

const randInt = n => Math.round(Math.random() * n);
const randSlice = _ => Math.round(Math.random()) ? 'blue' : 'green'; // eslint-disable-line no-confusing-arrow
const randStr = n => [...Array(n)].map(_ => String.fromCharCode(Math.round(Math.random() * 25) + 97)).join('');

function createServiceStates(targetState, currentState, n, state) {
  return [...Array(n)].map(_ => createServiceStatePairs(targetState, currentState, state));
}

function createServiceStatePairs(targetState, currentState, state = 'Install') {
  const serviceVersion = `${randInt(10)}.${randInt(100)}.${randInt(1000)}`;
  const serviceSlice = `${randSlice()}`;
  const serviceName = `${randStr(22)}`;
  const consulServiceName = `${randStr(2)}-${serviceName}`;
  const owningCluster = `${randStr(22)}`;
  const serverRole = `${randStr(1)}${randInt(99)}-${randStr(2)}-${randStr(12)}`;
  const deploymentId = `${randStr(8)}-${randStr(8)}-${randStr(8)}-${randStr(8)}`;
  const ignore = state === 'Ignore';

  const inCurrentState = state === 'Install' || state === 'Unexpected';
  const inTargetState = state === 'Install' || state === 'Ignore';

  let targetService = {
    Name: serviceName,
    DeploymentId: deploymentId,
    Slice: serviceSlice,
    Action: ignore ? 'Ignore' : 'Install'
  };

  let currentService = {
    Name: consulServiceName,
    Service: consulServiceName,
    Tags: [
      `version:${serviceVersion}`,
      `slice:${serviceSlice}`,
      `owning_cluster:${owningCluster}`,
      `server_role:${serverRole}`
    ]
  };

  if (!inTargetState) {
    targetService.Name = consulServiceName;
  }

  targetState.push(targetService);

  if (inCurrentState) {
    currentState.push(currentService);
  }
}
