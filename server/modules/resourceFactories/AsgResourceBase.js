/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let co = require('co');
let ec2Client = require('../ec2-monitor/ec2-monitor-client');
let amazonClientFactory = require('../amazon-client/childAccountClient');
let AwsError = require('../errors/AwsError.class');
let AutoScalingGroupNotFoundError = require('../errors/AutoScalingGroupNotFoundError.class');
let AutoScalingGroupAlreadyExistsError = require('../errors/AutoScalingGroupAlreadyExistsError.class');
let cacheManager = require('../cacheManager');
let fp = require('lodash/fp');
let logger = require('../logger');

function getAllAsgsInAccount(accountId, names) {
  logger.debug(`Describing all ASGs in account "${accountId}"...`);
  let asgs = ec2Client.getHostGroups()
    .then((_asgs) => {
      if (names && names.length) {
        return _asgs.filter(_asg => names.some(n => _asg.AutoScalingGroupName === n));
      } else {
        return _asgs;
      }
    });
  return asgs;
}

let asgCache = cacheManager.create('Auto Scaling Groups', getAllAsgsInAccount, { stdTTL: 60 });

function AsgResourceBase(accountId) {
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

    return asgCache.get(accountId).then(fp.filter(predicate));
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
        Value: parameters.tagValue
      }]
    };
    return asgClient().then(client => client.createOrUpdateTags(request).promise()).catch((error) => {
      throw standardifyError(error, parameters.name);
    });
  };

  this.delete = function ({ name, force }) {
    logger.warn(`Deleting Auto Scaling Group "${name}"`);
    return asgClient().then(client => client.deleteAutoScalingGroup({ AutoScalingGroupName: name, ForceDelete: force }).promise());
  };

  function updateASG(client, parameters) {
    let request = {
      AutoScalingGroupName: parameters.name
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

    return client.updateAutoScalingGroup(request).promise();
  }

  function updateLCHs(client, parameters) {
    let request = {
      AutoScalingGroupName: parameters.name,
      LifecycleHookName: '10min-draining'
    };

    if (_.isNil(parameters.scaling)) return Promise.resolve();

    if (!parameters.scaling.terminationDelay) {
      return client.deleteLifecycleHook(request).promise().catch(() => { });
    }

    Object.assign(request, {
      HeartbeatTimeout: parameters.scaling.terminationDelay * 60,
      LifecycleTransition: 'autoscaling:EC2_INSTANCE_TERMINATING',
      DefaultResult: 'CONTINUE'
    });

    return client.putLifecycleHook(request).promise();
  }

  this.put = (parameters) => {
    asgCache.del(accountId);
    return co(function* () {
      let client = yield asgClient();
      yield updateASG(client, parameters);
      yield updateLCHs(client, parameters);
    }).catch((error) => {
      throw standardifyError(error, parameters.name);
    });
  };

  this.enterInstancesToStandby = (parameters) => {
    let request = {
      AutoScalingGroupName: parameters.name,
      ShouldDecrementDesiredCapacity: true,
      InstanceIds: parameters.instanceIds
    };
    return asgClient().then(client => client.enterStandby(request).promise());
  };

  this.exitInstancesFromStandby = (parameters) => {
    let request = {
      AutoScalingGroupName: parameters.name,
      InstanceIds: parameters.instanceIds
    };
    return asgClient().then(client => client.exitStandby(request).promise());
  };

  this.post = request => asgClient().then(client => client.createAutoScalingGroup(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.attachLifecycleHook = request => asgClient().then(client => client.putLifecycleHook(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.attachNotifications = request => asgClient().then(client => client.putNotificationConfiguration(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.describeScheduledActions = request => asgClient().then(client => client.describeScheduledActions(request).promise().then(result => result.ScheduledUpdateGroupActions).catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.describeLifeCycleHooks = request => asgClient().then(client => client.describeLifecycleHooks(request).promise().then(result => result.ScheduledUpdateGroupActions).catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.deleteScheduledAction = request => asgClient().then(client => client.deleteScheduledAction(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));

  this.createScheduledAction = request => asgClient().then(client => client.putScheduledUpdateGroupAction(request).promise().catch((error) => {
    throw standardifyError(error, request.AutoScalingGroupName);
  }));
}

module.exports = AsgResourceBase;
