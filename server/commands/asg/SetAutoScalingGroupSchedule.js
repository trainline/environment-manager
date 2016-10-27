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
let AutoScalingGroup = require('models/AutoScalingGroup');

module.exports = function SetAutoScalingGroupScheduleCommandHandler(command) {
  assertContract(command, 'command', {
    properties: {
      accountName: { type: String, empty: false },
      autoScalingGroupName: { type: String, empty: false },
      propagateToInstances: { type: Boolean },
    },
  });

  return co(function* () {
    let schedule = command.schedule;
    let accountName = command.accountName;
    let autoScalingGroupName = command.autoScalingGroupName;
    let propagateToInstances = command.propagateToInstances;

    let scalingSchedule;
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

    let result = {
      ChangedAutoScalingGroups: undefined,
      ChangedInstances: undefined,
    };

    result.ChangedAutoScalingGroups = yield setAutoScalingGroupSchedule(
      autoScalingGroupName,
      schedule,
      scalingSchedule,
      accountName
    );

    if (propagateToInstances) {
      let autoScalingGroup = yield AutoScalingGroup.getByName(accountName, autoScalingGroupName);
      let instanceIds = autoScalingGroup.Instances.map(instance => instance.InstanceId);

      result.ChangedInstances = yield setEC2InstancesScheduleTag(
        instanceIds,
        schedule,
        accountName
      );
    }

    return result;
  });
};

function setAutoScalingGroupSchedule(autoScalingGroupName, schedule, scalingSchedule, accountName) {
  return autoScalingGroupClientFactory.create({ accountName }).then(client => {

    let setScheduleTask = setAutoScalingGroupScalingSchedule(client, autoScalingGroupName, scalingSchedule, accountName);
    let setTagsTask = setAutoScalingGroupScheduleTag(client, autoScalingGroupName, schedule, accountName);

    return Promise
      .all([setScheduleTask, setTagsTask])
      .then(() => [autoScalingGroupName]);
      
  });
}

function setAutoScalingGroupScheduleTag(client, autoScalingGroupName, schedule, accountName) {
  let parameters = {
    name: autoScalingGroupName,
    tagKey: 'Schedule',
    tagValue: schedule,
  };

  return client.setTag(parameters);
}

function setAutoScalingGroupScalingSchedule(client, autoScalingGroupName, newScheduledActions, accountName) {

  return co(function* () {
    
    let existingScheduledActions = yield getScheduledActions(client, autoScalingGroupName);
    yield existingScheduledActions.map(action => {
      return deleteScheduledAction(client, action);
    });

    if (!(newScheduledActions instanceof Array)) return Promise.resolve();

    return newScheduledActions.map((action, index) => {
      let namedAction = {
        AutoScalingGroupName: autoScalingGroupName,
        ScheduledActionName: `EM-Scheduled-Action-${++index}`,
        MinSize: action.MinSize,
        MaxSize: action.MaxSize,
        DesiredCapacity: action.DesiredCapacity,
        Recurrence: action.Recurrence
      };
      return client.createScheduledAction(namedAction);
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
