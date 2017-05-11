/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-disable */
'use strict';

let sinon = require('sinon');
let rewire = require('rewire');
let assert = require('assert');

describe.only('GetServicePort', function() {
  let sut;
  let Service;
  const DEFAULT = { green:0, blue:0 };

  function setup(service) {
    Service = {
      getByName: sinon.stub().returns(Promise.resolve(service))
    };
    sut = rewire('queryHandlers/GetServicePort');
    sut.__set__({ Service }); //eslint-disable no-underscore-dangle
  }

  function mockService(bluePort, greenPort) {
    return [{
      Value: {
        BluePort: bluePort,
        GreenPort: greenPort
      }
    }];
  }
  
  it('returns default port value for empty input', () => {
    setup();
    return sut().then(result => assert.deepEqual(result, DEFAULT));
  });
  
  it('looks up the service config by name', () => {
    const SERVICE_NAME = 'realyCoolMockServiceName';
    return sut(SERVICE_NAME).then(result => {
      assert.ok(Service.getByName.calledWith(SERVICE_NAME))
    });
  });
  
  it('correctly resolves when both ports are known', () => {
    const BLUE = 9134;
    const GREEN = 7265;
    const EXPECTED = { blue:BLUE, green:GREEN };
    setup(mockService(BLUE, GREEN));
    return sut('serviceName').then(result => {
      return assert.deepEqual(result, EXPECTED);
    });
  });

  it('sets default blue port when only green port is known', () => {
    const GREEN = 7825;
    const EXPECTED = { blue:0, green:GREEN };
    setup(mockService(undefined, GREEN));
    return sut('serviceName').then(result => {
      return assert.deepEqual(result, EXPECTED);
    });
  });

  it('sets default green port when only blue port is known', () => {
    const BLUE = 1105;
    const EXPECTED = { blue:BLUE, green:0 };
    setup(mockService(BLUE, undefined));
    return sut('serviceName').then(result => {
      return assert.deepEqual(result, EXPECTED);
    });
  });
  
  it('returns default port values if the service is undefined', () => {
    setup(undefined);
    return sut('serviceName').then(result => {
      return assert.deepEqual(result, DEFAULT);
    });
  });
});

