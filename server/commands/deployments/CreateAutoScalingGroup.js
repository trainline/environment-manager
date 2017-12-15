/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let co = require('co');
let DeploymentCommandHandlerLogger = require('./DeploymentCommandHandlerLogger');
let autoScalingGroupClientFactory = require('../../modules/clientFactories/autoScalingGroupClientFactory');

module.exports = function CreateAutoScalingGroupCommandHandler(command) {
  let logger = new DeploymentCommandHandlerLogger(command);

  assert(command, 'Expected "command" argument not to be null.');
  assert(command.template, 'Expected "command" argument to contain "template" property not null.');
  assert(command.accountName, 'Expected "command" argument to contain "accountName" property not null or empty.');

  return co(function* () {
    let template = command.template;
    let accountName = command.accountName;
    let autoScalingGroupName = template.autoScalingGroupName;

    logger.info(`Creating [${autoScalingGroupName}] AutoScalingGroup...`);

    let autoScalingGroupClient = yield autoScalingGroupClientFactory.create({
      accountName
    });

    let request = getCreateAutoScalingGroupRequest(template);
    yield createAutoScalingGroup(logger, autoScalingGroupClient, request);

    logger.info(`AutoScalingGroup [${autoScalingGroupName}] has been created`);

    logger.info(`Configuring [${autoScalingGroupName}] AutoScalingGroup...`);
    yield attachLifecycleHook(logger, autoScalingGroupClient, template);
    yield attachNotificationsByTemplate(logger, autoScalingGroupClient, template);
    logger.info(`AutoScalingGroup [${autoScalingGroupName}] has been configured`);
  });
};

function attachLifecycleHook(logger, asgClient, template) {
  if (!template.scaling || !template.scaling.terminationDelay) {
    return Promise.resolve();
  }

  let request = {
    AutoScalingGroupName: template.autoScalingGroupName,
    LifecycleHookName: '10min-draining',
    HeartbeatTimeout: template.scaling.terminationDelay * 60,
    LifecycleTransition: 'autoscaling:EC2_INSTANCE_TERMINATING',
    DefaultResult: 'CONTINUE'
  };

  return asgClient.attachLifecycleHook(request);
}

function attachNotificationsByTemplate(logger, autoScalingGroupClient, template) {
  return co(function* () {
    let autoScalingGroupName = template.autoScalingGroupName;
    let requests = getAttachNotificationsRequests(template);

    if (!requests.length) {
      logger.info(`No [${autoScalingGroupName}] AutoScalingGroup notification has to be attached to any SNS topic`);
      return;
    }

    logger.info(`Attaching [${autoScalingGroupName}] AutoScalingGroup notifications to SNS topics...`);

    yield requests.map(request => attachNotifications(autoScalingGroupClient, request));

    logger.info(`All [${autoScalingGroupName}] AutoScalingGroup notifications have been attached to SNS topics`);
  });
}

// ----------------------------------------------------------------------------------------------
// Functions to promisify [autoScalingGroupClient] interface

function createAutoScalingGroup(logger, autoScalingGroupClient, request) {
  return autoScalingGroupClient.post(request);
}

function attachNotifications(autoScalingGroupClient, request) {
  return autoScalingGroupClient.attachNotifications(request);
}

// ----------------------------------------------------------------------------------------------
// Functions to create requests understandable to AWS AutoScaling APIs

function getCreateAutoScalingGroupRequest(template) {
  let request = {
    AutoScalingGroupName: template.autoScalingGroupName,
    LaunchConfigurationName: template.launchConfigurationName,
    MaxSize: template.size.max,
    MinSize: template.size.min,
    VPCZoneIdentifier: template.subnets.join(','),
    DesiredCapacity: template.size.desired,
    Tags: getAutoScalingGroupTags(template.tags)
  };

  return request;
}

function getAutoScalingGroupTags(tags) {
  let autoScalingGroupTags = [];
  for (let tag in tags) {
    if ({}.hasOwnProperty.call(tags, tag)) {
      autoScalingGroupTags.push({
        Key: tag,
        Value: tags[tag]
      });
    }
  }

  return autoScalingGroupTags;
}

function getAttachNotificationsRequests(template) {
  let requests = template.topicNotificationMapping.map((mapping) => {
    let request = {
      AutoScalingGroupName: template.autoScalingGroupName,
      TopicARN: mapping.topicArn,
      NotificationTypes: mapping.notificationTypes
    };

    return request;
  });

  return requests;
}
