/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-disable */
'use strict';

let sinon = require('sinon');
let rewire = require('rewire');
let assert = require('assert');

describe('GetServicePortConfig', function() {
  let sut;
  let Service;
  const DEFAULT_PORT = 0;
  const DEFAULT = { green:DEFAULT_PORT, blue:DEFAULT_PORT };

  function setup(service) {
    Service = {
      getByName: sinon.stub().returns(Promise.resolve(service))
    };
    sut = rewire('queryHandlers/GetServicePortConfig');
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
    const EXPECTED = { blue:DEFAULT_PORT, green:GREEN };
    setup(mockService(undefined, GREEN));
    return sut('serviceName').then(result => {
      return assert.deepEqual(result, EXPECTED);
    });
  });

  it('sets default green port when only blue port is known', () => {
    const BLUE = 1105;
    const EXPECTED = { blue:BLUE, green:DEFAULT_PORT };
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

  it('converts the port number to an integer if possible', () => {
    const BLUE = '9134';
    const EXPECTED = { blue: 9134, green: DEFAULT_PORT };
    setup(mockService(BLUE, undefined));
    return sut('serviceName').then(result => {
      return assert.deepEqual(result, EXPECTED);
    });
  });

  it('assigns the default port number if the port number cannot be converted to an integer', () => {
    const BLUE = '913.4';
    const EXPECTED = { blue: DEFAULT_PORT, green: DEFAULT_PORT };
    setup(mockService(BLUE, undefined));
    return sut('serviceName').then(result => {
      return assert.deepEqual(result, EXPECTED);
    });
  });
});

