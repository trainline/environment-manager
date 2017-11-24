'use strict';

let { mapValues } = require('lodash/fp');
const inject = require('inject-loader!../../../../api/controllers/asgs/asgController');
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
      getAccountNameForEnvironment: () => Promise.reject(new Error('BOOM!'))
    };
    let sut = inject({
      '../../../models/Environment': environment,
      '../../../modules/data-access/opsEnvironment': {
        get: () => Promise.resolve()
      },
      '../../../modules/sns/EnvironmentManagerEvents': { publish: () => () => undefined }
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

function assertMutationPreventedWhenEnvironmentLocked(req, handlerFunctionName) {
  context('when the environment search returns a locked environment', function () {
    let sut = inject({
      '../../../models/Environment': {
        getAccountNameForEnvironment: () => Promise.resolve('my-account')
      },
      '../../../modules/data-access/opsEnvironment': {
        get: () => Promise.resolve({ Value: { DeploymentsLocked: true } })
      },
      '../../../modules/sns/EnvironmentManagerEvents': { publish: () => () => undefined }
    });
    it('it returns an error response', function () {
      let res = {
        status: sinon.spy(() => ({}))
      };
      let next = sinon.spy(() => Promise.resolve());
      return sut[handlerFunctionName](req, res, next)
        .then(() => sinon.assert.calledWith(res.status, 400));
    });
  });
}

describe('asgController', function () {
  let req = mkreq({ account: 'my-account', body: { value: {} }, environment: 'my-env', name: 'my-name' });

  describe('getAsgByName', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, this.title);
  });

  describe('getAsgs', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, this.title);
  });

  describe('getAsgIps', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, this.title);
  });

  describe('getAsgLaunchConfig', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, this.title);
  });

  describe('getScalingSchedule', function () {
    assertItCallsErrorCallbackWhenEnvironmentNotFound(req, this.title);
  });

  describe('deleteAsg', function () {
    assertMutationPreventedWhenEnvironmentLocked(req, this.title);
  });

  describe('putAsg', function () {
    assertMutationPreventedWhenEnvironmentLocked(req, this.title);
  });

  describe('putScalingSchedule', function () {
    assertMutationPreventedWhenEnvironmentLocked(req, this.title);
  });

  describe('putAsgSize', function () {
    assertMutationPreventedWhenEnvironmentLocked(req, this.title);
  });

  describe('putAsgLaunchConfig', function () {
    assertMutationPreventedWhenEnvironmentLocked(req, this.title);
  });
});
