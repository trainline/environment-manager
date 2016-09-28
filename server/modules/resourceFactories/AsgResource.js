/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _  = require('lodash');
let AwsError = require('modules/errors/AwsError.class');
let AutoScalingGroupNotFoundError = require('modules/errors/AutoScalingGroupNotFoundError.class');
let AutoScalingGroupAlreadyExistsError = require('modules/errors/AutoScalingGroupAlreadyExistsError.class');

function AsgResource(client) {
  this.client = client;

  function standardifyError(error, autoScalingGroupName) {
    if (!error) return null;
    var awsError = new AwsError(error.message);
    if (error.message.indexOf('AutoScalingGroup name not found') >= 0) {
      return new AutoScalingGroupNotFoundError(
        `AutoScalingGroup "${autoScalingGroupName}" not found.`, awsError
      );
    }

    if (error.code === 'AlreadyExists') {
      return new AutoScalingGroupAlreadyExistsError(
        `AutoScalingGroup "${autoScalingGroupName}" already exists.`, awsError
      );
    }

    return awsError;
  }

  function describeAutoScalingGroups(names) {
    let AutoScalingGroup = require('models/AutoScalingGroup');

    let asgs = [];
    let request = {};

    if (names && names.length) {
      request.AutoScalingGroupNames = names;
    }

    function query() {
      return client.describeAutoScalingGroups(request).promise().then(data => {
        asgs = asgs.concat(data.AutoScalingGroups);
        if (!data.NextToken) {
          return _.map(asgs, asg => new AutoScalingGroup(asg));
        }
        // Scan from next index
        request.NextToken = data.NextToken;
        return query(client);
      });
    };

    return query();
  }

  this.get = function (parameters) {
    return describeAutoScalingGroups([parameters.name]).then(result => {
      if (result.length > 0) return result[0];
      throw new AutoScalingGroupNotFoundError(`AutoScalingGroup "${parameters.name}" not found.`);
    }).catch(function (error) {
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
      },],
    };
    return client.createOrUpdateTags(request).promise().catch(function (error) {
      throw standardifyError(error, parameters.name);
    });
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

    return client.updateAutoScalingGroup(request).promise().catch(function (error) {
      throw standardifyError(error, parameters.name);
    });
  };

  this.enterInstancesToStandby = (parameters) => {
    let request = {
      AutoScalingGroupName: parameters.name,
      ShouldDecrementDesiredCapacity: true,
      InstanceIds: parameters.instanceIds,
    };
    return this.client.enterStandby(request).promise();
  };

  this.exitInstancesFromStandby = (parameters) => {
    let request = {
      AutoScalingGroupName: parameters.name,
      InstanceIds: parameters.instanceIds,
    };
    return this.client.exitStandby(request).promise();
  };

  this.post = (request) => {
    return this.client.createAutoScalingGroup(request).promise().catch(error => {
      throw standardifyError(error, request.AutoScalingGroupName);
    });
  };

  this.attachNotifications = (request) => {
    return this.client.putNotificationConfiguration(request).promise().catch(error => {
      throw standardifyError(error, request.AutoScalingGroupName);
    });
  };

  this.attachLifecycleHook = (request) => {
    return this.client.putLifecycleHook(request).promise().catch(error => {
      throw standardifyError(error, request.AutoScalingGroupName);
    });
  };

  this.describeScheduledActions = (request) => {
    return this.client.describeScheduledActions(request).promise().then(result => {
      return result.ScheduledUpdateGroupActions;
    }).catch((error) => {
      throw standardifyError(error, request.AutoScalingGroupName);
    });
  };

  this.deleteScheduledAction = (request) => {
    return this.client.deleteScheduledAction(request).promise().catch(error => {
      throw standardifyError(error, request.AutoScalingGroupName);
    });
  };

  this.createScheduledAction = (request) => {
    return this.client.putScheduledUpdateGroupAction(request).promise().catch(error => {
      throw standardifyError(error, request.AutoScalingGroupName);
    });
  };

}

module.exports = AsgResource;
