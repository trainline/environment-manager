'use strict';

const assert = require('assert');
const rewire = require('rewire');
const sinon = require('sinon');

describe('Create Event', () => {
  let createTopicSpy;
  let sut;

  beforeEach(() => {
    createTopicSpy = sinon.spy((name, cb) => { cb(); });
    sut = rewire('../../../../modules/sns/EnvironmentManagerEvents/createTopic');
    /* eslint-disable no-underscore-dangle */
    sut.__set__('aws', {
      SNS: function SNS() {
        this.createTopic = createTopicSpy;
      }
    });
  });

  it('should exist', () => {
    assert.ok(sut);
  });

  it('should reject without a name', (done) => {
    sut('')
      .catch((err) => {
        assert.equal(err, 'When creating a topic, a name parameter must be provided.');
        done();
      });
  });

  it('should reject with a name that is too long', (done) => {
    let tooLong = '';
    let limit = 256;
    for (let i = 0; i < (limit + 1); i += 1) {
      tooLong += 'a';
    }
    sut(tooLong)
      .catch((err) => {
        assert.equal(err, 'When creating a topic, a name parameter should be a maximum of 256 characters.');
        done();
      });
  });

  it('should reject with an invalid name', (done) => {
    let nonAlphanumericName = 'abc123!"£$$';
    sut(nonAlphanumericName)
      .catch((err) => {
        // eslint-disable-next-line max-len
        assert.equal(err, 'When creating a topic, a name parameter must be made up of only uppercase and lowercase ASCII letters, numbers, underscores, and hyphens.');
        done();
      });
  });

  it('should create a topic with aws passing the name given in the context', (done) => {
    sut('EnvironmentManagerConfigurationChange')
      .then((result) => {
        assert.ok(createTopicSpy.calledWith({ Name: 'EnvironmentManagerConfigurationChange' }));
        done();
      });
  });
});
