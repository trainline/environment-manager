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
    message = {
      topic: 'Topic Name Here',
      message: 'Message Value Here'
    };
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

  describe('Creating a topic', () => {
    it('should call the aws client with the topicName', (done) => {
      sut.createTopic(message.topic)
        .then(() => {
          assert.ok(fakeAwsClient.createTopic.calledWith(message.topic));
        })
        .then(done);
    });
  });

  describe('Getting a topic arn', () => {
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
    it('should use the provided client to create an event', (done) => {
      sut.produceMessage(message)
        .then(() => {
          assert.ok(fakeAwsClient.publish.calledWith(message));
        })
        .then(done);
    });
  });
});

