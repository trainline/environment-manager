'use strict';

const assert = require('assert');
const sinon = require('sinon');
const MockExpressRequest = require('mock-express-request');
const MockExpressResponse = require('mock-express-response');

describe('Creating a Dynamic Response based on the Express request Accept header', () => {
  let sut;
  let mockRequest;
  let mockResponse;
  let spyOnJson;
  let spyOnSend;
  let spyOnStatus;
  let status;
  let url;

  beforeEach(() => {
    sut = require('api/controllers/package-upload-url/dynamicResponseCreator');
    mockRequest = new MockExpressRequest();
    mockResponse = new MockExpressResponse();
    spyOnJson = sinon.spy(mockResponse, 'json');
    spyOnSend = sinon.spy(mockResponse, 'send');
    spyOnStatus = sinon.spy(mockResponse, 'status');
    status = 200;
    url = 'http://something.com/location/blah';
  });

  describe('a request with Accept for application/json', () => {
    it('should create responder that when invoked, calls the Express response.json()', () => {
      mockRequest = createJsonRequest();

      sut(mockRequest, status, url)(mockResponse);

      assert.ok(spyOnStatus.calledWith(status));
      assert.ok(spyOnJson.calledWith({ url }));
    });
  });

  describe('a request with Accept header that does not feature application/json', () => {
    it('should create a responder that when invoked, called the Express response.send()', () => {
      mockResponse = new MockExpressResponse();
      spyOnSend = sinon.spy(mockResponse, 'send');
      spyOnJson = sinon.spy(mockResponse, 'json');
      spyOnStatus = sinon.spy(mockResponse, 'status');
      mockRequest = createNothingRequest();

      sut(mockRequest, status, url)(mockResponse);

      assert.ok(spyOnSend.calledWith(url));
      assert.ok(spyOnStatus.calledWith(status));
      assert.ok(spyOnJson.notCalled);
    });
  });
});

function createJsonRequest() {
  return new MockExpressRequest({
    method: 'GET',
    url: '/stuff?q=thing',
    headers: {
      Accept: 'application/json'
    }
  });
}

function createNothingRequest() {
  return new MockExpressRequest({
    headers: {
      Accept: 'nothing at all please!'
    }
  });
}
