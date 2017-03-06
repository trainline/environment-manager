/* eslint-disable no-shadow*/

'use strict';

const assert = require('assert');
const sinon = require('sinon');
const SNS = require('models/SNS');

describe.only('SNS Model', () => {
  let sut;
  let fakeAwsClient;
  let message;
  let response;

  beforeEach(() => {
    message = buildMessage();
    response = {
      ResponseMetadata: {
        TopicArn: 'This is a pretend ARN value'
      }
    };
    fakeAwsClient = {
      createTopic: sinon.stub().returns(Promise.resolve(response)),
      publish: sinon.stub().returns(Promise.resolve(message))
    };
    sut = new SNS(fakeAwsClient);
  });

  describe('Valid messages', () => {
    let requiredProperties;

    beforeEach(() => {
      requiredProperties = [
        'message'
      ];
    });

    it('should contain a static validation function', () => {
      assert.ok(SNS.validateMessage);
    });

    it('should throw without 1 argument to validate', () => {
      assert.throws(() => {
        SNS.validateMessage();
      });
    });

    it('should fail when given a message without a required property', () => {
      let message = buildMessage();
      delete message.phoneNumber;

      assert.ok(SNS.validateMessage(message));

      requiredProperties.forEach((requiredProp) => {
        let message = buildMessage();
        delete message[requiredProp];

        assert.throws(() => {
          SNS.validateMessage(message);
        });
      });
    });

    it('should fail given no phone number or target arn', () => {
      let message = buildMessage();
      delete message.targetArn;
      delete message.phoneNumber;

      assert.throws(() => {
        SNS.validateMessage(message);
      });
    });

    it('should fail given both phone number and target arn', () => {
      let message = buildMessage();

      assert.throws(() => {
        SNS.validateMessage(message);
      });
    });
  });

  describe('Creating a topic', () => {
    it('should result in an error if asked to create a topic with no topic', (done) => {
      sut.createTopic('')
        .catch(() => {
          assert.ok(true);
          done();
        });
    });

    it('should call the aws client with the topicName', (done) => {
      sut.createTopic(message.topic)
        .then(() => {
          assert.ok(fakeAwsClient.createTopic.calledWith(message.topic));
        })
        .then(done);
    });
  });

  describe('Getting a topic arn', () => {
    it('should result in an error if asked to get a topic with no topic', (done) => {
      sut.getTopicArn('')
        .catch(() => {
          assert.ok(true);
          done();
        });
    });

    it('should provide the arn value given by the aws client', (done) => {
      sut.getTopicArn(message.topic)
        .then((arn) => {
          assert.ok(fakeAwsClient.createTopic.calledWith(message.topic));
          assert.equal(arn, response.ResponseMetadata.TopicArn);
        })
        .then(done);
    });
  });

  describe('Producing a new event', () => {
    it('should result in an error if asked to get a produce a message with no message', (done) => {
      sut.produceMessage('')
        .catch(() => {
          assert.ok(true);
          done();
        });
    });

    it('should use the provided client to create an event', (done) => {
      sut.produceMessage(message)
        .then(() => {
          assert.ok(fakeAwsClient.publish.calledWith(message));
        })
        .then(done);
    });
  });
});

function buildMessage() {
  return {
    message: 'message to send',
    phoneNumber: 1222998,
    targetArn: 'target ARN',
    endpointArn: 'endpoint ARN'
  };
}
