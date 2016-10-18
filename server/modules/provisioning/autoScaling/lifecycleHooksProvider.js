/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let LifecycleHookType = require('Enums').LifecycleHookType;
let LifecycleHookDefaultResult = require('Enums').LifecycleHookDefaultResult;
let sender = require('modules/sender');

module.exports = {
  get(accountName) {
    return co(function* () {
      let role = yield getRoleByName('roleInfraAsgScale', accountName);
      let topic = yield getTopicByName('InfraAsgLambdaScale', accountName);

      return [{
        name: '10min-draining',
        type: LifecycleHookType.InstanceTerminating,
        roleArn: role.Arn,
        topicArn: topic.TopicArn,
        defaultResult: LifecycleHookDefaultResult.Continue,
        heartbeatTimeout: '10m',
      }];
    });
  },
};

function getRoleByName(roleName, accountName) {
  let query = {
    name: 'GetRole',
    accountName,
    roleName,
  };

  return sender.sendQuery({ query });
}

function getTopicByName(topicName, accountName) {
  let query = {
    name: 'GetTopic',
    accountName,
    topicName,
  };

  return sender.sendQuery({ query });
}
