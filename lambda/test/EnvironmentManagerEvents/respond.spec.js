'use strict';

const assert = require('assert');
const sinon = require('sinon');

describe('Respond', () => {
  let sut;
  let context;
  let succeedSpy;

  beforeEach(() => {
    // eslint-disable-next-line global-require
    sut = require('../../EnvironmentManagerEvents/respond').respond;
    succeedSpy = sinon.spy();
    context = {
      succeed: succeedSpy
    };
  });

  it('should call succeed on the context with a valid response', () => {
    let result = sut(context);
    result('Response Body Example');
    assert.ok(succeedSpy.calledWith(createValidResponse('Response Body Example')));
  });
});

describe('Respond to failure', () => {
  let sut;
  let context;
  let failSpy;

  beforeEach(() => {
    // eslint-disable-next-line global-require
    sut = require('../../EnvironmentManagerEvents/respond').fail;
    failSpy = sinon.spy();
    context = {
      fail: failSpy
    };
  });

  it('should call fail on the context with a valid 500 fail response', () => {
    let result = sut(context);
    result('Error Reason Example');
    assert.ok(failSpy.calledWith(createValidFailResponse('Error Reason Example')));
  });
});

function createValidResponse(body) {
  return {
    statusCode: 200,
    body: JSON.stringify(body),
    headers: {}
  };
}

function createValidFailResponse(body) {
  let response = createValidResponse(body);
  response.statusCode = 500;
  return response;
}
