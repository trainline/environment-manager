/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

class SNS {
  constructor(awsClient) {
    this.awsClient = awsClient;
  }

  static validateMessage(message) {
    if (!message) {
      throw new Error('You must provide a message to validate');
    }

    let errors = [];

    let expectedProperties = ['message'];

    expectedProperties.forEach((item) => {
      if (!message[item]) {
        errors.push(`Message must contain ${item} as a property.`);
      }
    });

    let rules = [
      function mustContainEitherPhoneNumberOrTargetArn(msg) {
        if (!msg.phoneNumber && !msg.targetArn) {
          errors.push('Message must contain either Phone Number or Target ARN');
        }
      },
      function mustNotContainBothPhoneNumberAndTargetArn(msg) {
        if (msg.phoneNumber && msg.targetArn) {
          errors.push('Message must contain either Phone Number or Target ARN, but not both.');
        }
      }
    ];

    rules.forEach((rule) => {
      rule(message);
    });

    if (errors.length > 0) {
      throw new Error(errors.join('\n'));
    } else {
      return true;
    }
  }

  createTopic(topicName) {
    if (!topicName) {
      return Promise.reject(new Error('A Topic Name must be provided when creating a Topic.'));
    }
    return this.awsClient.createTopic(topicName);
  }

  getTopicArn(topicName) {
    if (!topicName) {
      return Promise.reject(new Error('A Topic Name must be provided when getting a Topic ARN.'));
    }
    return this.awsClient.createTopic(topicName)
      .then(response => response.ResponseMetadata.TopicArn);
  }

  produceMessage(message) {
    if (!message) {
      return Promise.reject(new Error('A valid message must be provided when producing a message.'));
    }
    return this.awsClient.publish(message);
  }
}

module.exports = SNS;
