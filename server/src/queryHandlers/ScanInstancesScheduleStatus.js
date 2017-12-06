/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let _ = require('lodash');
let sender = require('../modules/sender');
let scheduling = require('../modules/scheduling');
let opsEnvironment = require('../modules/data-access/opsEnvironment');
let ScanInstances = require('./ScanInstances');
let ScanAutoScalingGroups = require('./ScanAutoScalingGroups');

module.exports = function ScanInstancesScheduleStatusQueryHandler(query) {
  return co(function* () { // eslint-disable-line func-names
    let instances = yield getInstances(query);
    let dateTime = query.dateTime ? query.dateTime : new Date();
    return [...scheduledActionsForInstances(instances, dateTime), ...scheduledActionsForASGs(instances, dateTime)];
  });
};

function getInstances(query) {
  return Promise.all([getAllInstances(query), getAllEnvironments(query), getAllASGs(query)]).then((data) => {
    let allInstances = data[0];
    let environments = buildEnvironmentIndex(data[1]);
    let asgs = buildASGIndex(data[2]);
    let instances = [];
    allInstances.forEach((instance) => {
      let environmentName = getInstanceTagValue(instance, 'environment');
      if (environmentName) {
        instance.Environment = findInIndex(environments, environmentName.toLowerCase());
      }
      let asgName = getInstanceTagValue(instance, 'aws:autoscaling:groupName');
      instance.AutoScalingGroup = findInIndex(asgs, asgName);
      instances.push(instance);
    });
    return instances;
  });
}

function getAutoScalingGroups(instances) {
  let autoScalingGroups = {};
  for (let currentInstance of instances) {
    if (typeof currentInstance.AutoScalingGroup !== 'undefined') {
      autoScalingGroups[currentInstance.AutoScalingGroup.AutoScalingGroupName] = currentInstance.AutoScalingGroup;
    }
  }
  return autoScalingGroups;
}

function getStandAloneInstances(instances) {
  let standAloneInstances = [];
  for (let currentInstance of instances) {
    if (typeof currentInstance.AutoScalingGroup === 'undefined') {
      standAloneInstances.push(currentInstance);
    }
  }
  return standAloneInstances;
}

function scheduledActionsForASGs(instances, dateTime) {
  let actions = [];
  let autoScalingGroups = getAutoScalingGroups(instances);
  for (let autoScalingGroup of autoScalingGroups) {
    let scalingActions = scheduling.actionsForAutoScalingGroup(autoScalingGroup, instances, dateTime);
    if (scalingActions && scalingActions.length && scalingActions.length > 0) {
      actions = [...actions, ...scalingActions];
    }
  }
  return actions;
}

function scheduledActionsForInstances(instances, dateTime) {
  return getStandAloneInstances(instances).map((instance) => {
    let action = scheduling.actionForInstance(instance, dateTime);
    return action;
  });
}

function buildEnvironmentIndex(environmentData) {
  let environments = {};

  environmentData.forEach((env) => {
    let environment = env.Value;
    environment.Name = env.EnvironmentName.toLowerCase();
    environments[environment.Name] = environment;
  });

  return environments;
}

function buildASGIndex(asgData) {
  let asgs = {};

  asgData.forEach((asg) => {
    asgs[asg.AutoScalingGroupName] = asg;
  });

  return asgs;
}

function findInIndex(map, name) {
  return name ? map[name] : undefined;
}

function getInstanceTagValue(instance, tagName) {
  let tag = _.first(instance.Tags.filter(t => t.Key.toLowerCase() === tagName.toLowerCase()));
  return tag ? tag.Value : undefined;
}

function getAllInstances(query) {
  return sender.sendQuery(ScanInstances, {
    query: {
      name: 'ScanInstances',
      accountName: query.accountName,
      queryId: query.queryId,
      username: query.username,
      timestamp: query.timestamp
    }
  });
}

function getAllEnvironments() {
  return opsEnvironment.scan();
}

function getAllASGs(query) {
  return sender.sendQuery(ScanAutoScalingGroups, {
    query: {
      name: 'ScanAutoScalingGroups',
      accountName: query.accountName,
      queryId: query.queryId,
      username: query.username,
      timestamp: query.timestamp
    }
  });
}
