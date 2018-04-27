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

function setupControllerToReturnDuplicatePorts() {
  servicesConfigController.__set__('services', {
    scan: () => Promise.resolve([
      { Value: { BluePort: 10000, GreenPort: 10001 } }
    ])
  });
}

function setupControllerToReturnAvailablePorts() {
  servicesConfigController.__set__('services', {
    scan: () => Promise.resolve([
      { Value: { BluePort: 99990, GreenPort: 99991 } }
    ]),

    create() { return Promise.resolve(); }
  });
}

function createReq() {
  return {
    swagger: {
      params: {
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
