'use strict';

const assert = require('assert');

describe.only('Create Event', () => {
  let sut;

  beforeEach(() => {
    // eslint-disable-next-line global-require
    sut = require('modules/sns/EnvironmentManagerEvents/createEvent');
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
    let invalidAttribute = { DataType: '', StringValue: '' };
    event.attributes.EnvironmentType = invalidAttribute;

    assert.throws(() => {
      sut(event);
    });
  });

  it('should fail if any of the message attributes are invalid', () => {
    let event = createLambdaEvent();
    event.attributes.ThisShouldNotBeHere = createAttribute();
    event.attributes.NeitherShouldThis = createAttribute();

    assert.throws(() => {
      sut(event);
    },
      /^Error: Non valid attributes provided: ThisShouldNotBeHere,NeitherShouldThis$/);
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
    attributes: {
      EnvironmentType: createAttribute()
    }
  };
}

function createAttribute(DataType = 'String', StringValue = 'StringValueOfAttribute') {
  return {
    DataType,
    StringValue
  };
}
