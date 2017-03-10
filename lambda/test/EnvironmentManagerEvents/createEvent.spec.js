'use strict';

const assert = require('assert');

describe('Create Event', () => {
  let sut;

  beforeEach(() => {
    sut = require('../../EnvironmentManagerEvents/createEvent');
  });

  it('should fail without a configuration parameter', () => {
    assert.throws(() => {
      sut();
    },
      /Expected a configuration object when creating an event./);
  });

  it('should fail without a message property in the lambda event', () => {
    let event = createLambdaEvent();
    delete event.message;

    assert.throws(() => {
      sut(event);
    },
    /Missing expected message attribute./);
  });

  it('should fail if any message attributes are incorrect', () => {
    let event = createLambdaEvent();
    let invalidAttribute = {
      Key: { DataType: "", StringValue: "" }
    };
    event.attributes[invalidAttribute] = invalidAttribute;
    
    assert.throws(() => {
      sut(event);
    });
  });

  it('should return a function with closed over event attributes', () => {
    let event = createLambdaEvent();

    let result = sut(event);

    assert.ok(result().Message === event.message);
    assert.ok(result().MessageAttributes === event.attributes);
  });

  it('should map the topic given to a TargetArn', () => {
    let TopicArn = 'Topic';

    let result = sut(createLambdaEvent());

    assert.ok(result(TopicArn).TargetArn === TopicArn);
  });
});

function createLambdaEvent() {
  return { 
    message: 'This is the message',
    attributes: { SomeKey: {DataType: "String", StringValue: "StringValueOfAttribute"}}
  };
}