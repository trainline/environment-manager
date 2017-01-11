/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assert = require('assert');
let co = require('co');
let ms = require('ms');
let DeploymentCommandHandlerLogger = require('commands/deployments/DeploymentCommandHandlerLogger');
let autoScalingGroupClientFactory = require('modules/clientFactories/autoScalingGroupClientFactory');

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
      accountName: accountName,
    });

    let request = getCreateAutoScalingGroupRequest(template);
    yield createAutoScalingGroup(logger, autoScalingGroupClient, request);

    logger.info(`AutoScalingGroup [${autoScalingGroupName}] has been created`);
    logger.info(`Configuring [${autoScalingGroupName}] AutoScalingGroup...`);

    yield [
      attachNotificationsByTemplate(logger, autoScalingGroupClient, template),
      attachLifecycleHooksByTemplate(logger, autoScalingGroupClient, template),
    ];

    logger.info(`AutoScalingGroup [${autoScalingGroupName}] has been configured`);
  });
};

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

function attachLifecycleHooksByTemplate(logger, autoScalingGroupClient, template) {
  return co(function* () {
    let autoScalingGroupName = template.autoScalingGroupName;
    let requests = getAttachLifecycleHookRequests(template);

    if (!requests.length) {
      logger.info(`No lifecycle hook has to be attached to [${autoScalingGroupName}] AutoScalingGroup`);
      return;
    }

    logger.info(`Attaching lifecycle hooks to [${autoScalingGroupName}] AutoScalingGroup...`);

    yield requests.map(request => attachLifecycleHook(autoScalingGroupClient, request));

    logger.info(`All lifecycle hooks have been attached to [${autoScalingGroupName}] AutoScalingGroup`);
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

function attachLifecycleHook(autoScalingGroupClient, request) {
  return autoScalingGroupClient.attachLifecycleHook(request);
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
    Tags: getAutoScalingGroupTags(template.tags),
  };

  return request;
}

function getAutoScalingGroupTags(tags) {
  let autoScalingGroupTags = [];
  for (let tag in tags) {
    autoScalingGroupTags.push({
      Key: tag,
      Value: tags[tag],
    });
  }

  return autoScalingGroupTags;
}

function getAttachNotificationsRequests(template) {
  let requests = template.topicNotificationMapping.map(mapping => {
    let request = {
      AutoScalingGroupName: template.autoScalingGroupName,
      TopicARN: mapping.topicArn,
      NotificationTypes: mapping.notificationTypes,
    };

    return request;
  });

  return requests;
}

function getAttachLifecycleHookRequests(template) {
  let requests = template.lifecycleHooks.map(hook => {
    let request = {
      AutoScalingGroupName: template.autoScalingGroupName,
      LifecycleHookName: hook.name,
      LifecycleTransition: hook.type,
      RoleARN: hook.roleArn,
      NotificationTargetARN: hook.topicArn,
      HeartbeatTimeout: (ms(hook.heartbeatTimeout) / 1000),
      DefaultResult: hook.defaultResult,
    };

    return request;
  });

  return requests;
}
