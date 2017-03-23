'use strict';

const assert = require('assert');
const rewire = require('rewire');
const sinon = require('sinon');

describe('Publish Event', () => {
  let sut;
  let event;
  let publishSpy;

  beforeEach(() => {
    sut = rewire('modules/sns/EnvironmentManagerEvents/publishEvent');
    publishSpy = sinon.spy((name, cb) => { return cb(null, 'result value'); });
    // eslint-disable-next-line no-underscore-dangle
    sut.__set__('aws', {
      SNS: function SNS() {
        this.publish = publishSpy;
      }
    });
    event = createValidEvent();
  });

  it('should fail given an event without a TargetArn', () => {
    delete event.TargetArn;

    assert.throws(() => {
      sut(event);
    }, /An event to be published must contain a TargetArn property./);
  });

  it('should fail given an event without a Message', () => {
    delete event.Message;

    assert.throws(() => {
      sut(event);
    }, /An event to be published must contain a Message property./);
  });

  it('should fail given a message attribute without a valid DataType', () => {
    event.MessageAttributes.InvalidAttribute = {
      DataType: '',
      StringValue: 'I have a valid string value!'
    };

    assert.throws(() => {
      sut(event);
    }, /All MessageAttribute values must contain a DataType property./);
  });

  it('should pass on the event to the AWS SNS publish', (done) => {
    sut(event)
      .then(() => {
        assert.ok(publishSpy.calledWith(event));
        done();
      });
  });

  it('should return the result of the publish to the caller', (done) => {
    sut(event)
      .then((result) => {
        assert.equal(result, publishSpy('name', (err, r) => {
          return r;
        }));
        done();
      });
  });
});

function createValidEvent() {
  return {
    TargetArn: 'String Value To Represent ARN',
    Message: 'This is a string value to represent the message',
    MessageAttributes: {
      AttrKeyOne: {
        DataType: 'String',
        StringValue: 'StringValue'
      },
      AttrKeyTwo: {
        DataType: 'String',
        StringValue: 'StringValue'
      }
    }
  };
}
