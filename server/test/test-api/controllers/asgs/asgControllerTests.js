'use strict';

let { mapValues } = require('lodash/fp');
let proxyquire = require('proxyquire').noCallThru();
require('should');
let sinon = require('sinon');

function mkreq(params) {
  return {
    swagger: {
      params: mapValues(x => ({ value: x }))(params)
    }
  };
}

function assertItCallsErrorCallbackWhenEnvironmentNotFound(req, handlerFunctionName) {
  context('when the environment search returns a rejected promise', function () {
    let environment = {
      getAccountNameForEnvironment: sinon.spy(() => Promise.reject(new Error('BOOM!')))
    };
    let sut = proxyquire('api/controllers/asgs/asgController', {
      'models/Environment': environment
    });
    it('it calls the Express error callback', function () {
      let res = null;
      let next = sinon.spy(error => error);
      return sut[handlerFunctionName](req, res, next)
        .catch(() => undefined)
        .then(() => sinon.assert.called(next));
    });
  });
}

describe('asgController', function () {
  let req = mkreq({ account: 'my-account', body: {}, environment: 'my-env', name: 'my-name' });
  describe('getAsgByName', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'getAsgByName');
  });

  describe('getAsgs', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'getAsgs');
  });

  describe('getAsgIps', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'getAsgIps');
  });

  describe('getAsgLaunchConfig', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'getAsgLaunchConfig');
  });

  describe('getScalingSchedule', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'getScalingSchedule');
  });

  describe('deleteAsg', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'deleteAsg');
  });

  describe('putScalingSchedule', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'putScalingSchedule');
  });

  describe('putScalingSchedule', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'putScalingSchedule');
  });

  describe('putAsgSize', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'putAsgSize');
  });

  describe('putAsgLaunchConfig', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, 'putAsgLaunchConfig');
  });
});
