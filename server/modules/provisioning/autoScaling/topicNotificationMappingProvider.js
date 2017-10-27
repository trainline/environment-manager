/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let AutoScalingNotificationType = require('../../../Enums').AutoScalingNotificationType;
let sender = require('../../sender');
let GetTopic = require('../../../queryHandlers/GetTopic');

const TopicsToNotify = [
  'InfraAsgLambdaScale'
];

module.exports = {
  get(accountName) {
    let mappings = TopicsToNotify.map(topicName =>
      getMappingsByTopicName(topicName, accountName)
    );

    return Promise.all(mappings);
  }
};

function getMappingsByTopicName(topicName, accountName) {
  return getTopicByName(topicName, accountName).then((topic) => {
    let mapping = {
      topicName,
      topicArn: topic.TopicArn,
      notificationTypes: [
        AutoScalingNotificationType.InstanceLaunch,
        AutoScalingNotificationType.InstanceLaunchError,
        AutoScalingNotificationType.InstanceTerminate,
        AutoScalingNotificationType.InstanceTerminateError
      ]
    };
    return Promise.resolve(mapping);
  });
}

function getTopicByName(topicName, accountName) {
  let query = {
    name: 'GetTopic',
    accountName,
    topicName
  };

  return sender.sendQuery(GetTopic, { query });
}
