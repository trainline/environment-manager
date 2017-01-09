/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let amazonClientFactory = require('modules/amazon-client/childAccountClient');
let AwsError = require('modules/errors/AwsError.class');
let AutoScalingGroupNotFoundError = require('modules/errors/AutoScalingGroupNotFoundError.class');
let AutoScalingGroupAlreadyExistsError = require('modules/errors/AutoScalingGroupAlreadyExistsError.class');
let AutoScalingGroup = require('models/AutoScalingGroup');
let cacheManager = require('modules/cacheManager');
let fp = require('lodash/fp');
let logger = require('modules/logger');
let pages = require('modules/amazon-client/pages');

function getAllAsgsInAccount(accountId, names) {
  logger.debug(`Describing all ASGs in account "${accountId}"...`);
  let request = (names && names.length) ? { AutoScalingGroupNames: names } : {};
  let asgDescriptions = amazonClientFactory.createASGClient(accountId)
    .then(client => pages.flatten(page => page.AutoScalingGroups, client.describeAutoScalingGroups(request)));
  return asgDescriptions;
}

let asgCache = cacheManager.create('Auto Scaling Groups', getAllAsgsInAccount, { stdTTL: 60 });

function AsgResource(accountId) {
  let asgClient = () => amazonClientFactory.createASGClient(accountId);

  function standardifyError(error, autoScalingGroupName) {
    if (!error) return null;
    let awsError = new AwsError(error.message);
    if (error.message.indexOf('AutoScalingGroup name not found') >= 0) {
      return new AutoScalingGroupNotFoundError(`AutoScalingGroup "${autoScalingGroupName}" not found.`, awsError);
    }

    if (error.code === 'AlreadyExists') {
      let message = `AutoScalingGroup "${autoScalingGroupName}" already exists.`;
      return new AutoScalingGroupAlreadyExistsError(message, awsError);
    }

    return awsError;
  }

  function describeAutoScalingGroups(names) {
    let predicate = (() => {
      if (names && names.length) {
        let nameSet = new Set(names);
        return asg => nameSet.has(asg.AutoScalingGroupName);
      } else {
        return () => true;
      }
    })();

    return asgCache.get(accountId).then(fp.flow(fp.filter(predicate), fp.map(asg => new AutoScalingGroup(asg))));
  }

  this.get = function (parameters) {
    if (parameters.clearCache === true) {
      asgCache.del(accountId);
    }
    return describeAutoScalingGroups([parameters.name]).then((result) => {
      if (result.length > 0) return result[0];
      throw new AutoScalingGroupNotFoundError(`AutoScalingGroup "${parameters.name}" not found.`);
    }).catch((error) => {
      throw new AwsError(error.message);
    });
  };

  this.all = function (parameters) {
    return describeAutoScalingGroups(parameters.names);
  };

  this.setTag = function (parameters) {
    let request = {
      Tags: [{
        Key: parameters.tagKey,
        PropagateAtLaunch: true,
        ResourceId: parameters.name,
        ResourceType: 'auto-scaling-group',
        Value: parameters.tagValue,
      }],
    };
    return asgClient().then(client => client.createOrUpdateTags(request).promise()).catch((error) => {
      throw standardifyError(error, parameters.name);
    });
  };

  this.delete = function ({ name, force }) {
    logger.warn(`Deleting Auto Scaling Group "${name}"`);
    return asgClient().then(client => client.deleteAutoScalingGroup({ AutoScalingGroupName: name, ForceDelete: force }).promise());
  };

  this.put = function (parameters) {
    let request = {
      AutoScalingGroupName: parameters.name,
    };

    if (!_.isNil(parameters.minSize)) {
      request.MinSize = parameters.minSize;
    }

    if (!_.isNil(parameters.desiredSize)) {
      request.DesiredCapacity = parameters.desiredSize;
    }

    if (!_.isNil(parameters.maxSize)) {
      request.MaxSize = parameters.maxSize;
    }

    if (parameters.launchConfigurationName) {
      request.LaunchConfigurationName = parameters.launchConfigurationName;
    }

    if (!_.isNil(parameters.subnets)) {
      request.VPCZoneIdentifier = parameters.subnets.join(',');
    }

    asgCache.del(accountId);

    return asgClient().then(client => client.updateAutoScalingGroup(request).promise()).catch((error) => {
      throw standardifyError(error, parameters.name);
    });
  };

  this.enterInstancesToStandby = (parameters) => {
    let request = {
      AutoScalingGroupName: parameters.name,
      ShouldDecrementDesiredCapacity: true,
      InstanceIds: parameters.instanceIds,
    };
    return asgClient().then(client => client.enterStandby(request).promise());
  };

  this.exitInstancesFromStandby = (parameters) => {
    let request = {
      AutoScalingGroupName: parameters.name,
      InstanceIds: parameters.instanceIds,
    };
    return asgClient().then(client => client.exitStandby(request).promise());
  };

  this.post = request => asgClient().then(client => client.createAutoScalingGroup(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.attachNotifications = request => asgClient().then(client => client.putNotificationConfiguration(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.attachLifecycleHook = request => asgClient().then(client => client.putLifecycleHook(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.describeScheduledActions = request => asgClient().then(client => client.describeScheduledActions(request).promise().then(result => result.ScheduledUpdateGroupActions).catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.deleteScheduledAction = request => asgClient().then(client => client.deleteScheduledAction(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.createScheduledAction = request => asgClient().then(client => client.putScheduledUpdateGroupAction(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));
}

module.exports = AsgResource;
