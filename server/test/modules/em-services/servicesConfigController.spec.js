'use strict';

/* eslint no-underscore-dangle: 0 */

const assert = require('assert');
const rewire = require('rewire');
const servicesConfigController = rewire('../../../api/controllers/config/services/servicesConfigController');

describe('services controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = createReq();
    servicesConfigController.__set__('getMetadataForDynamoAudit', () => { });
    servicesConfigController.__set__('sns', { publish() { } });
  });

  describe('creating new service config entry', () => {
    it('should not allow service to be created with existing ports', (done) => {
      setupControllerToReturnDuplicatePorts();
      res = createResWithStatusExpectation(400);
      servicesConfigController.postServicesConfig(req, res, () => { })
        .then(() => {
          assert(res.statusCalledWithCorrectArguments());
          assert(res.getSendCount() === 1);
          done();
        });
    });

    it('should allow service to be created when the ports are not already in use', (done) => {
      setupControllerToReturnAvailablePorts();
      res = createResWithStatusExpectation(201);
      servicesConfigController.postServicesConfig(req, res, () => { })
        .then(() => {
          assert(res.statusCalledWithCorrectArguments());
          assert(res.getEndCount() === 1);
          done();
        });
    });
  });

  describe('updating existing service config entry', () => {
    it('should not allow port numbers to change', (done) => {
      setupControllerToReturnAvailablePorts();
      let next = createNextExpectedToBeCalledWith('Cannot change the port values of a service.');
      servicesConfigController.putServiceConfigByName(req, res, next.next)
        .then(() => {
          assert(next.nextCalledWithExpectedArguments());
          done();
        });
    });

    it('should allow updates when the port number is the same as current', (done) => {
      res = createResWithStatusExpectation(200);
      setupControllerToReturnDuplicatePorts();
      servicesConfigController.putServiceConfigByName(req, res, () => { })
        .then(() => {
          assert(res.statusCalledWithCorrectArguments());
          assert(res.getEndCount() === 1);
          done();
        });
    });
  });

  describe('deleting a service config entry', () => {
    it('should return an error when trying to delete', () => {
      res = createResWithStatusExpectation(405);
      servicesConfigController.deleteServiceConfigByName({}, res, () => { });
      assert(res.statusCalledWithCorrectArguments());
      assert(res.getEndCount() === 1);

      res = createResWithStatusExpectation(405);
      servicesConfigController.deleteServiceConfigByNameAndCluster({}, res, () => { });
      assert(res.statusCalledWithCorrectArguments());
      assert(res.getEndCount() === 1);
    });
  });

  describe('dealing with results from aws that do not have expected Value property', () => {
    beforeEach(() => {
      servicesConfigController.__set__('getAllServicesConfig', () => {
        return Promise.resolve([{ Value: { Working: true } }, { Working: false }]);
      });
    });

    it('should send positive result even when there are no Value properties', (done) => {
      setupControllerToReturnAvailablePorts();
      res = createResWithStatusExpectation(201);
      servicesConfigController.postServicesConfig(req, res, () => { })
        .then(() => {
          assert(res.statusCalledWithCorrectArguments());
          assert(res.getEndCount() === 1);
          done();
        });
    });
  });
});

function setupControllerToReturnDuplicatePorts() {
  servicesConfigController.__set__('services', {
    scan: () => Promise.resolve([
      { Value: { BluePort: 10000, GreenPort: 10001 } }
    ]),
    replace: () => { return Promise.resolve(); },
    get() { return Promise.resolve({ Value: { BluePort: 10000, GreenPort: 10001 } }); }
  });
}

function setupControllerToReturnAvailablePorts() {
  servicesConfigController.__set__('services', {
    scan: () => Promise.resolve([
      { Value: { BluePort: 99990, GreenPort: 99991 } }
    ]),
    replace: () => { return Promise.resolve(); },
    get() { return Promise.resolve({ Value: { BluePort: 99990, GreenPort: 99991 } }); },
    create() { return Promise.resolve(); }
  });
}

function createReq() {
  return {
    swagger: {
      params: {
        name: { value: 'service_name' },
        cluster: { value: '' },
        body: {
          value: {
            BluePort: 10000,
            GreenPort: 10001
          }
        }
      }
    }
  };
}

function createNextExpectedToBeCalledWith(expect) {
  let _called = false;

  return {
    next(v) {
      if (v.message === expect) _called = true;
    },
    nextCalledWithExpectedArguments() {
      return _called;
    }
  };
}

function createResWithStatusExpectation(expectedCode) {
  let _status = false;
  let _sendCount = 0;
  let _endCount = 0;

  return {
    send() {
      _sendCount += 1;
    },
    end() {
      _endCount += 1;
    },
    status(s) {
      if (s === expectedCode) _status = true;
      return this;
    },
    statusCalledWithCorrectArguments() {
      return _status;
    },
    getSendCount() {
      return _sendCount;
    },
    getEndCount() {
      return _endCount;
    }
  };
}
