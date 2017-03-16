'use strict';

const assert = require('assert');

describe('Create Event', () => {
  let sut;
  let ResponseMetadata;

  beforeEach(() => {
    // eslint-disable-next-line global-require
    sut = require('modules/sns/EnvironmentManagerEvents/getTargetArn');
    ResponseMetadata = createResponseMetadata();
  });

  it('should throw if the ResponseMetadata contains no TopicArn', () => {
    delete ResponseMetadata.TopicArn;

    assert.throws(() => {
      sut(ResponseMetadata);
    }, /ResponseMetadata does not contain a TopicArn value to extract./);
  });

  it('should extract TargetArn value from the ResponseMetadata', () => {
    let result = sut(ResponseMetadata);
    assert.equal(result, 'This is the topic arn value'); 
  });
});

function createResponseMetadata() {
  return {
    TopicArn: 'This is the topic arn value'
  };
}
