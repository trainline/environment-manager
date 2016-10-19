/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let resourceProvider = require('modules/resourceProvider');
let co = require('co');
let _ = require('lodash');
let sender = require('modules/sender');
let config = require('config');
let scheduling = require('modules/scheduling');

module.exports = function ScanInstancesScheduleStatusQueryHandler(query) {
  return co(function*() {

    let instances = yield getInstances(query);
    let scheduledActions = scheduledActionsForInstances(instances);

    return scheduledActions;

  });  
};

function getInstances(query) {

  return Promise.all([getAllInstances(query), getAllEnvironments(query), getAllASGs(query)]).then(data => {

    let allInstances = data[0];
    let environments = buildEnvironmentIndex(data[1]);
    let asgData = data[2];
    let asgs = buildASGIndex(data[2]);

    let instances = [];

    allInstances.forEach(instance => {
      let environmentName = getInstanceTagValue(instance, 'environment');
      instance.Environment = findInIndex(environments, environmentName);

      let asgName = getInstanceTagValue(instance, 'aws:autoscaling:groupName');
      instance.AutoScalingGroup = findInIndex(asgs, asgName);

      instances.push(instance);
    });

    return instances;

  });

}

function scheduledActionsForInstances(instances) {

  let dateTime = new Date();

  return instances.map(instance => {
    let action = scheduling.actionForInstance(instance, dateTime);
    return { action, instance: instance.InstanceId };
  });

}

function buildEnvironmentIndex(environmentData) {

  let environments = {};

  environmentData.forEach(env => {
    let environment = env.Value;
    environment.Name = env.EnvironmentName;
    environments[env.EnvironmentName] = environment;
  });

  return environments;

}

function buildASGIndex(asgData) {

  let asgs = {};

  asgData.forEach(asg => {
    asgs[asg.AutoScalingGroupName] = asg;
  });

  return asgs;

}

function findInIndex(map, name) {
  if (name) return map[name];
}

function getInstanceTagValue(instance, tagName) {
  let tag = _.first(instance.Tags.filter(tag => tag.Key.toLowerCase() == tagName.toLowerCase()));
  if (tag) return tag.Value;
}

function getAllInstances(query) {
  return sender.sendQuery({
    query: {
      name: 'ScanInstances',
      accountName: query.accountName,
      queryId: query.queryId,
      username: query.username,
      timestamp: query.timestamp
    }
  });
}

function getAllEnvironments(query) {
  let masterAccountName = config.getUserValue('masterAccountName');
  return sender.sendQuery({
    query: {
      name: 'ScanDynamoResources',
      accountName: masterAccountName,
      resource: 'ops/environments',
      queryId: query.queryId,
      username: query.username,
      timestamp: query.timestamp
    }
  });
}

function getAllASGs(query) {
  return sender.sendQuery({
    query: {
      name: 'ScanAutoScalingGroups',
      accountName: query.accountName,
      queryId: query.queryId,
      username: query.username,
      timestamp: query.timestamp
    }
  });
}