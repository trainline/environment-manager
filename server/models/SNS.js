/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

class SNS {
  constructor(awsClient) {
    this.awsClient = awsClient;
  }

  createTopic(topicName) {
    return this.awsClient.createTopic(topicName);
  }

  getTopicArn(topicName) {
    return this.awsClient.createTopic(topicName)
      .then(response => response.ResponseMetadata.TopicArn);
  }

  produceMessage(message) {
    return this.awsClient.publish(message);
  }
}

module.exports = SNS;
