/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let assertContract = require('modules/assertContract');
let co = require('co');
let autoScalingGroupClientFactory = require('modules/clientFactories/autoScalingGroupClientFactory');
let sender = require('modules/sender');

let SCHEDULE_PATTERN = /^(NOSCHEDULE\s+)?((247|OFF|on|on6)|(((Start|Stop): [\d\,\-\*\\]+ [\d\,\-\*\\]+ [\d\,\-\*\\\w]+ [\d\,\-\*\\\w]+ [\d\,\-\*\\\w]+\s?[\d\,\-\*]*)(\s*\;?\s+|$))+)?(\s*NOSCHEDULE)?$/i;
let InvalidOperationError = require('modules/errors/InvalidOperationError.class');
let ec2InstanceClientFactory = require('modules/clientFactories/ec2InstanceClientFactory');

module.exports = function SetAutoScalingGroupScheduleCommandHandler(command) {
  assertContract(command, 'command', {
    properties: {
      accountName: { type: String, empty: false },
      autoScalingGroupName: { type: String, empty: false },
      propagateToInstances: { type: Boolean },
    },
  });

  return co(function* () {
    var schedule = command.schedule;
    var accountName = command.accountName;
    var autoScalingGroupName = command.autoScalingGroupName;
    var propagateToInstances = command.propagateToInstances;

    var schedule, scalingSchedule;
    if (_.isArray(command.schedule)) {
      scalingSchedule = command.schedule;
      schedule = 'NOSCHEDULE';
    } else {
      scalingSchedule = [];
      schedule = command.schedule;
    }

    if (!SCHEDULE_PATTERN.exec(schedule)) {
      return Promise.reject(new InvalidOperationError(
        `Provided schedule is invalid. Current value: "${schedule}".`
      ));
    }

    var result = {
      ChangedAutoScalingGroups: undefined,
      ChangedInstances: undefined,
    };

    result.ChangedAutoScalingGroups = setAutoScalingGroupSchedule(
      autoScalingGroupName,
      schedule,
      scalingSchedule,
      accountName
    );

    if (propagateToInstances) {
      var autoScalingGroup = yield getAutoScalingGroupByName(autoScalingGroupName, accountName);
      var instanceIds = autoScalingGroup.Instances.map(instance => instance.InstanceId);

      result.ChangedInstances = setEC2InstancesScheduleTag(
        instanceIds,
        schedule,
        accountName
      );
    }

    return yield result;
  });
};

function getAutoScalingGroupByName(autoScalingGroupName, accountName) {
  var query = {
    name: 'GetAutoScalingGroup',
    accountName: accountName,
    autoScalingGroupName: autoScalingGroupName,
  };

  return sender.sendQuery({ query: query });
}

function setAutoScalingGroupSchedule(autoScalingGroupName, schedule, scalingSchedule, accountName) {
  return autoScalingGroupClientFactory.create({ accountName }).then(client => {

    var setScheduleTask = setAutoScalingGroupScalingSchedule(client, autoScalingGroupName, scalingSchedule, accountName);
    var setTagsTask = setAutoScalingGroupScheduleTag(client, autoScalingGroupName, schedule, accountName);

    return Promise
      .all([setScheduleTask, setTagsTask])
      .then(() => [autoScalingGroupName]);
      
  });
}

function setAutoScalingGroupScheduleTag(client, autoScalingGroupName, schedule, accountName) {
  var parameters = {
    name: autoScalingGroupName,
    tagKey: 'Schedule',
    tagValue: schedule,
  };

  return client.setTag(parameters);
}

function setAutoScalingGroupScalingSchedule(client, autoScalingGroupName, newScheduledActions, accountName) {

  return co(function* () {
    
    var existingScheduledActions = yield getScheduledActions(client, autoScalingGroupName);
    yield existingScheduledActions.map(action => {
      return deleteScheduledAction(client, action);
    });

    if (!(newScheduledActions instanceof Array)) return Promise.resolve();

    return newScheduledActions.map((action, index) => {
      var namedAction = {
        AutoScalingGroupName: autoScalingGroupName,
        ScheduledActionName: `EM-Scheduled-Action-${++index}`,
        MinSize: action.MinSize,
        MaxSize: action.MaxSize,
        DesiredCapacity: action.DesiredCapacity,
        Recurrence: action.Recurrence
      };
      return createScheduledAction(client, namedAction);
    });

  });

}

function getScheduledActions(client, autoScalingGroupName) {
  let parameters = {
    AutoScalingGroupName: autoScalingGroupName,
  };
  return client.describeScheduledActions(parameters);
}

function deleteScheduledAction(client, action) {
  let parameters = {
    AutoScalingGroupName: action.AutoScalingGroupName,
    ScheduledActionName: action.ScheduledActionName
  };
  return client.deleteScheduledAction(parameters);
}

function createScheduledAction(client, action) {
  return client.createScheduledAction(action);
}


function setEC2InstancesScheduleTag(instanceIds, schedule, accountName) {
  if (!instanceIds.length) return Promise.resolve();
  return ec2InstanceClientFactory.create({ accountName }).then(client => {
    let parameters = {
      instanceIds: instanceIds,
      tagKey: 'Schedule',
      tagValue: schedule,
    };

    return client.setTag(parameters).then(() => instanceIds);
  });
}
