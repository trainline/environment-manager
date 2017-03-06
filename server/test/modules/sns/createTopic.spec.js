'use strict';

const assert = require('assert');
const sinon = require('sinon');
const rewire = require('rewire');

/* eslint-disable no-underscore-dangle */

describe.only('Create topic for SNS', () => {
  let sut;
  let createTopicSpy;
  let params;

  beforeEach(() => {
    sut = rewire('modules/sns/createTopic');
    params = {};
    createTopicSpy = {
      createTopic: sinon.spy((_, cb) => { return cb(); })
    };
    sut.__set__({
      masterAccountClient: {
        createSNSClient: sinon.stub().returns(Promise.resolve(createTopicSpy))
      }
    });
  });

  it('should pass the params given to the aws client', (done) => {
    sut(params)
      .then(() => {
        assert.ok(createTopicSpy.createTopic.calledWith(params));
        done();
      });
  });
});
