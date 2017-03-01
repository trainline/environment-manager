'use strict';

let proxyquire = require('proxyquire').noCallThru();
require('should');
let sinon = require('sinon');
let stream = require('stream');

function fakeLogger() {
  return {
    debug: sinon.spy(),
    info: sinon.spy(),
    warn: sinon.spy(),
    error: sinon.spy()
  };
}

describe('packageMover', function () {
  describe('downloadPackage', function () {
    it('when S3 GetObject throws an exception it is returned as a rejected Promise', function () {
      let packageMover = proxyquire('commands/deployments/packageMover', {
        'modules/amazon-client/s3Url': {
          getObject: () => { throw new Error('BOOM!'); },
          parse: () => true
        }
      });
      let logger = fakeLogger();
      let sut = packageMover(logger);
      return sut.downloadPackage('http://localhost:8080/myPackage.zip')
        .should.be.rejectedWith(/BOOM!/);
    });
    it('when S3 GetObject stream emits an error it is logged', function () {
      let downloadStream = new stream.Readable();
      let packageMover = proxyquire('commands/deployments/packageMover', {
        'modules/amazon-client/s3Url': {
          getObject: () => downloadStream,
          parse: () => true
        }
      });
      let logger = fakeLogger();
      let sut = packageMover(logger);
      return sut.downloadPackage('http://localhost:8080/myPackage.zip')
        .then(() => downloadStream.emit('error', new Error('BOOM!')))
        .then(() => sinon.assert.calledWithMatch(logger.warn, /Download failed: BOOM!/i));
    });
  });
});
