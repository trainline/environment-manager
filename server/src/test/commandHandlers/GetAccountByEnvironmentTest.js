/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let rewire = require('rewire');
let assert = require('assert');
let sinon = require('sinon');

const CANNED_ENVIRONMENT = {
  OwningCluster: "Code to Joy",
  Description: "A Mock Environment",
  EnvironmentType: "MockEnvironmentType",
  SchemaVersion: 1,
  DeploymentMap: "MockDepMap"
};

const CANNED_ENV_TYPE = {
  DeploymentBucket: "tl-deployment-mock",
  Consul:{
    SecurityTokenPath: {
      Key: "path/to/configuration.json",
      Bucket: "tl-bucket-mock"
    },
    Port: 8500,
    Servers: [],
    DataCenter: "mock-dc"
  },
  LoadBalancers: [],
  Subnets: {},
  SchemaVersion: 2,
  AWSAccountNumber: 9012342345664,
  VpcId: "vpc-dfgh4f5g",
  AWSAccountName: "MockAccount"
};

describe('GetAccountByEnvironment', function() {
  const command = {
    name: 'GetAccountByEnvironment',
    environment: 'mck22'
  };

  let resolveStub = val => sinon.stub().returns(Promise.resolve(val));
  let rejectStub = val => sinon.stub().returns(Promise.reject(val));
  let configCache = {};
  let sut;

  beforeEach(() => {
    configCache.getEnvironmentByName = resolveStub(CANNED_ENVIRONMENT);
    configCache.getEnvironmentTypeByName = resolveStub(CANNED_ENV_TYPE);

    sut = rewire('../../commands/aws/GetAccountByEnvironment');
    sut.__set__({ configCache });
  });

  describe('with a known environment, type and account', function() {
    it('tries to find an environment with the supplied name', () => {
      return sut(command).then(() => {
        assert(configCache.getEnvironmentByName.calledOnce);
        assert.equal(configCache.getEnvironmentByName.args[0], command.environment);
      });
    });

    it('tries to find an environment type with the derived name', () => {
      return sut(command).then(() => {
        assert(configCache.getEnvironmentTypeByName.calledOnce);
        assert.equal(configCache.getEnvironmentTypeByName.args[0], CANNED_ENVIRONMENT.EnvironmentType);
      });
    });

    it('resolves the "URL account name"', () => {
      return sut(command).then((result) => {
        assert.equal(result, CANNED_ENV_TYPE.AWSAccountName);
      });
    });
  });

  describe('with an unknown environment', function() {
    it('rejects with an error describing an unknown environment', () => {
      configCache.getEnvironmentByName = resolveStub(null);

      return sut(command).catch((error) => {
        assert.equal(error.message, `Could not find environment ${command.environment}`);
      });
    });

    it('propagates the error if the environment lookup throws', () => {
      const environmentError = new Error(`An error has occurred retrieving "${command.environment}"`);
      configCache.getEnvironmentByName = rejectStub(environmentError);

      return sut(command).catch((error) => {
        assert.equal(error.message, environmentError.message);
      });
    });
  });

  describe('with an unknown environment type', function() {
    it('rejects with an error describing an unknown environment', () => {
      configCache.getEnvironmentTypeByName = resolveStub(null);

      return sut(command).catch((error) => {
        assert.equal(error.message, `Could not find environment type for ${command.environment}`);
      });
    });

    it('propagates the error if the environment type lookup throws', () => {
      const environmentTypeError = new Error(`An error has occurred retrieving type "${command.environment}"`);
      configCache.getEnvironmentTypeByName = rejectStub(environmentTypeError);

      return sut(command).catch((error) => {
        assert.equal(error.message, environmentTypeError.message);
      });
    });
  });
});

