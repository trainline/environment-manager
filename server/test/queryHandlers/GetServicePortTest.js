/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
/* eslint-disable */
'use strict';

let sinon = require('sinon');
let rewire = require('rewire');
let assert = require('assert');

describe('GetServicePort', function() {
  let sut;
  let Service;
  
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
  
  it('returns 0 for no inputs', () => {
    setup();
    return sut().then(result => assert.equal(result, 0));
  });
  
  it('returns 0 for empty string inputs', () => {
    setup();
    return sut('', '').then(result => {
      return assert.equal(result, 0);
    });
  });
  
  it('looks up the service config by name', () => {
    return sut('mockServiceName', 'blue').then(result => {
      assert.ok(Service.getByName.calledOnce)
    });
  });
  
  it('correctly resolves blue ports', () => {
    const BLUE = 9134;
    const GREEN = 7265;
    setup(mockService(BLUE, GREEN));
    return sut('serviceName', 'blue').then(result => {
      return assert.equal(result, BLUE);
    });
  });

  it('correctly resolves green ports', () => {
    const BLUE = 6552;
    const GREEN = 4461;
    setup(mockService(BLUE, GREEN));
    return sut('serviceName', 'green').then(result => {
      return assert.equal(result, GREEN);
    });
  });
  
  it('is case insensitive', () => {
    const BLUE = 9134;
    const GREEN = 7265;
    setup(mockService(BLUE, GREEN));
    return sut('serviceName', 'bLuE').then(result => {
      return assert.equal(result, BLUE);
    });
  });
  
  it('ignores whitespace', () => {
    const BLUE = 6552;
    const GREEN = 4461;
    setup(mockService(BLUE, GREEN));
    return sut(' serviceName ', '  green     ').then(result => {
      return assert.equal(result, GREEN);
    });
  });
  
  it('returns 0 if the given slice is undefined', () => {
    const BLUE = 6552;
    const GREEN = 4461;
    setup(mockService(BLUE));
    return sut('serviceName', 'green').then(result => {
      return assert.equal(result, 0);
    });
  });
  
  it('returns 0 if the service is undefined', () => {
    setup(undefined);
    return sut('serviceName', 'blue').then(result => {
      return assert.equal(result, 0);
    });
  });
});

