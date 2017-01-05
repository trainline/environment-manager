/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let AutoScalingNotificationType = require('Enums').AutoScalingNotificationType;
let sender = require('modules/sender');

const TopicsToNotify = [
  'InfraAsgLambdaScale',
];

module.exports = {
  get: function (accountName) {
    var mappings = TopicsToNotify.map(topicName =>
      getMappingsByTopicName(topicName, accountName)
    );

    return Promise.all(mappings);
  },
};

function getMappingsByTopicName(topicName, accountName) {

  return getTopicByName(topicName, accountName).then(topic => {

    var mapping = {
      topicName: topicName,
      topicArn: topic.TopicArn,
      notificationTypes: [
        AutoScalingNotificationType.InstanceLaunch,
        AutoScalingNotificationType.InstanceLaunchError,
        AutoScalingNotificationType.InstanceTerminate,
        AutoScalingNotificationType.InstanceTerminateError,
      ],
    };
    return Promise.resolve(mapping);
  });

  return [mapping];
}

function getTopicByName(topicName, accountName) {

  var query = {
    name: 'GetTopic',
    accountName: accountName,
    topicName: topicName,
  };

  return sender.sendQuery({ query: query });
}
