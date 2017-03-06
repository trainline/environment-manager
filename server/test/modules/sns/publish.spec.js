'use strict';

const assert = require('assert');
const sinon = require('sinon');
const rewire = require('rewire');

/* eslint-disable no-underscore-dangle */

describe('sns client', () => {
  let sut;
  let publishSpy;
  let notification;

  beforeEach(() => {
    sut = rewire('modules/sns/publish');
    publishSpy = {
      publish: sinon.spy((_, cb) => { return cb(); })
    };
    sut.__set__({
      masterAccountClient: {
        createSNSClient: sinon.stub().returns(Promise.resolve(publishSpy))
      }
    });
    notification = createNotification();
  });

  it('should call the clients publish, passing notification', (done) => {
    sut(notification)
      .then(() => {
        assert.ok(publishSpy.publish.calledWith(notification));
        done();
      });
  });
});

function createNotification() {
  return {
    Name: ''
  };
}
