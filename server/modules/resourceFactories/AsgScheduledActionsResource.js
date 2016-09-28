/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _  = require('lodash');
let AwsError = require('modules/errors/AwsError.class');
let AutoScalingGroupNotFoundError = require('modules/errors/AutoScalingGroupNotFoundError.class');

function AsgScheduledActionsResource(client) {

  function describeScheduledActions(name) {
    return client.describeScheduledActions({ AutoScalingGroupName: name }).promise();
  }

  this.get = function (parameters) {
    return describeScheduledActions(parameters.name).then(function (result) {
      if (result.ScheduledUpdateGroupActions) {
        return {
          ScheduledActions: result.ScheduledUpdateGroupActions.map(action => {
            return {
              MinSize: action.MinSize,
              MaxSize: action.MaxSize,
              DesiredCapacity: action.DesiredCapacity,
              Recurrence: action.Recurrence
            };
          })
        };
      }
      throw new AutoScalingGroupNotFoundError(`AutoScalingGroup "${parameters.name}" not found.`);
    }).catch(function (error) {
      throw new AwsError(error.message);
    });
  };

}

module.exports = AsgScheduledActionsResource;
