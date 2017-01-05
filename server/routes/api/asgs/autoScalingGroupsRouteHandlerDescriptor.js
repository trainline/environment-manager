/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let send = require('modules/helpers/send');
let authorizer = require('modules/authorizers/asgs');
let route = require('modules/helpers/route');
let _ = require('lodash');

function getPropertyByName(object, name) {
  if (!object) return;
  var lowerCaseName = name.toLowerCase();

  for (var propertyName in object) {
    if (lowerCaseName !== propertyName.toLowerCase()) continue;
    return object[propertyName];
  }
}

module.exports = [
  route.get('/all/asgs')
  .withDocs({ description: 'Auto Scaling Group', verb: 'crossScan', tags: ['Auto Scaling Groups'] }).withPriority(10).do((request, response) => {
    var query = {
      name: 'ScanCrossAccountAutoScalingGroups',
    };

    send.query(query, request, response);
  }),
  route.get('/:account/asgs')
  .withDocs({ description: 'Auto Scaling Group', perAccount: true, verb: 'scan', tags: ['Auto Scaling Groups'] }).do((request, response, next) => {
    if (request.params.account === 'v1') {
      return next();
    }

    var query = {
      name: 'ScanAutoScalingGroups',
      accountName: request.params.account,
    };

    send.query(query, request, response);
  }),
  route.get('/:account/asgs/:name/')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  }).do((request, response, next) => {

    var query = {
      name: 'GetAutoScalingGroup',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
    };

    send.query(query, request, response);
  }),
  route.get('/:account/asgs/:name/size').inOrderTo('Get the size of an Auto Scaling Group within an account')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  }).do((request, response) => {
    var query = {
      name: 'GetAutoScalingGroupSize',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
    };

    send.query(query, request, response);
  }),
  route.put('/:account/asgs/:name/size').inOrderTo('Update the size of an Auto Scaling Group within an account')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  })
  .withAuthorizer(authorizer).whenRequest((url, value) => {
    var min = getPropertyByName(value, 'Min');
    var desired = getPropertyByName(value, 'Desired');
    var max = getPropertyByName(value, 'Max');

    if (_.isNil(min) && _.isNil(desired) && _.isNil(max)) {
      return new Error('Request body must contain at least one of the following fields: Min, Desired or Max.');
    }

    return null;
  }).do((request, response, next) => {
    var command = {
      name: 'SetAutoScalingGroupSize',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
      autoScalingGroupMinSize: getPropertyByName(request.body, 'Min'),
      autoScalingGroupDesiredSize: getPropertyByName(request.body, 'Desired'),
      autoScalingGroupMaxSize: getPropertyByName(request.body, 'Max'),
    };

    send.command(command, request, response);
  }),
  route.get('/:account/asgs/:name/schedule-status').inOrderTo('Get the current schedule status of an Auto Scaling Group')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  }).do((request, response) => {
    var query = {
      name: 'GetAutoScalingGroupScheduleStatus',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
    };

    send.query(query, request, response);
  }),
  route.get('/:account/asgs/:name/schedule-status/:date').inOrderTo('Get the schedule status of an Auto Scaling Group at a particular date/time')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  }).do((request, response) => {
    var query = {
      name: 'GetAutoScalingGroupScheduleStatus',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
      date: request.params.date,
    };

    send.query(query, request, response);
  }),
  route.put('/:account/asgs/:name/launchconfig/imageId').inOrderTo('Update the launch config image of an Auto Scaling Group')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  })
  .withAuthorizer(authorizer).whenRequest((url, value) => {
    var imageId = getPropertyByName(value, 'ImageId');

    if (imageId === undefined)
      return new Error('Request body must contain "ImageId" field.');

    if (imageId === '')
      return new Error('Provided ImageId must be not empty.');

    return null;
  }).do((request, response) => {
    var command = {
      name: 'SetLaunchConfigurationImageId',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
      imageId: getPropertyByName(request.body, 'ImageId'),
    };

    send.command(command, request, response);
  }),
  route.put('/:account/asgs/:name/launchconfig/instanceType').inOrderTo('Update the launch config instance type of an Auto Scaling Group')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  })
  .withAuthorizer(authorizer).whenRequest((url, value) => {
    var instanceType = getPropertyByName(value, 'InstanceType');

    if (instanceType === undefined)
      return new Error('Request body must contain "InstanceType" field.');

    if (instanceType === '')
      return new Error('Provided InstanceType must be not empty.');

    return null;
  }).do((request, response) => {
    var command = {
      name: 'SetLaunchConfigurationInstanceType',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
      instanceType: getPropertyByName(request.body, 'InstanceType'),
    };

    send.command(command, request, response);
  }),
  route.put('/:account/asgs/:name/schedule').inOrderTo('Update the schedule of an Auto Scaling Group')
  .withAuthorizer(authorizer)
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  })
  .whenRequest((url, value) => {
    var schedule = getPropertyByName(value, 'schedule');

    return schedule === undefined ? new Error('Request body must contain "Schedule" field in request body.') : null;

  }).do((request, response) => {
    var schedule = getPropertyByName(request.body, 'Schedule');
    var propagateToInstances = getPropertyByName(request.body, 'PropagateToInstances') ? true : false;

    var command = {
      name: 'SetAutoScalingGroupSchedule',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
      schedule: schedule,
      propagateToInstances: propagateToInstances,
    };

    send.command(command, request, response);
  }),
  route.put('/:account/asgs/:name/enterToStandby').inOrderTo('Put instances in ASG into standby mode')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  })
  .withAuthorizer(authorizer)
  .whenRequest((url, value) => {

    var instanceIds = getPropertyByName(value, 'instanceids');

    if (_.isNil(instanceIds)) return new Error('Expected "InstanceIds" field in request body.');
    if (_.isEmpty(instanceIds)) return new Error('Expected "InstanceIds" field not to be empty.');

    return null;

  }).do((request, response) => {

    var instanceIds = getPropertyByName(request.body, 'instanceids');

    var command = {
      name: 'EnterAutoScalingGroupInstancesToStandby',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
      instanceIds: instanceIds,
    };

    send.command(command, request, response);
  }),
  route.put('/:account/asgs/:name/exitFromStandby').inOrderTo('Exit ASG server instances from standby')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  })
  .withAuthorizer(authorizer)
  .whenRequest((url, value) => {

    var instanceIds = getPropertyByName(value, 'instanceids');

    if (_.isNil(instanceIds)) return new Error('Expected "InstanceIds" field in request body.');
    if (_.isEmpty(instanceIds)) return new Error('Expected "InstanceIds" field not to be empty.');

    return null;

  }).do((request, response) => {

    var instanceIds = getPropertyByName(request.body, 'instanceids');

    var command = {
      name: 'ExitAutoScalingGroupInstancesFromStandby',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
      instanceIds: instanceIds,
    };

    send.command(command, request, response);
  }),
];
