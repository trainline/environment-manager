'use strict';

const assert = require('assert');
const sinon = require('sinon');
const MockExpressRequest = require('mock-express-request');
const MockExpressResponse = require('mock-express-response');
const sut = require('api/controllers/package-upload-url/dynamicResponseCreator');

function createResponseForAcceptHeader(accept) {
  let next = sinon.spy();
  let response = new MockExpressResponse({
    request: new MockExpressRequest({
      headers: accept ? { Accept: accept } : {},
      next
    })
  });
  response.json = sinon.spy(response, 'json');
  response.send = sinon.spy(response, 'send');
  response.status = sinon.spy(response, 'status');
  return { next, response };
}

describe('Creating a Dynamic Response based on the Express request Accept header', () => {
  const status = 200;
  const url = 'http://something.com/location/blah';

  describe('a request with Accept for application/json', () => {
    it('should create responder that when invoked, calls the Express response.json()', () => {
      let { response } = createResponseForAcceptHeader('application/json');

      sut(status, url)(response);

      assert.ok(response.status.calledWith(status));
      assert.ok(response.json.calledWith({ url }));
    });
  });

  describe('a request with Accept header that does not feature application/json', () => {
    it('should create a responder that when invoked, called the Express response.send()', () => {
      let { response } = createResponseForAcceptHeader();

      sut(status, url)(response);

      assert.ok(response.send.calledWith(url));
      assert.ok(response.status.calledWith(status));
      assert.ok(response.json.notCalled);
    });
  });

  context('content type negotiation', function () {
    function respondsWithText({ response }) {
      sinon.assert.calledOnce(response.send);
      sinon.assert.notCalled(response.json);
    }

    function respondsWithJson({ response }) {
      sinon.assert.calledOnce(response.json);
    }

    function respondsWith406({ next }) {
      sinon.assert.calledWith(next, sinon.match.instanceOf(Error).and(sinon.match({ status: 406 })));
    }

    let scenarios = [
      { accept: undefined, assertion: respondsWithText },
      { accept: 'text/plain', assertion: respondsWithText },
      { accept: 'application/json', assertion: respondsWithJson },
      { accept: 'text/html', assertion: respondsWith406 },
      { accept: 'text/plain, application/json', assertion: respondsWithText },
      { accept: 'text/plain; q=0.1, application/json; q=0.2', assertion: respondsWithJson }
    ];
    scenarios.forEach(({ accept, assertion }) =>
      it(`when request accepts ${accept}, reponse ${assertion.name}`, function () {
        let { next, response } = createResponseForAcceptHeader(accept);
        sut(status, url)(response);
        assertion({ response, next });
      }));
  });
});
