/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let send = require('modules/helpers/send');
let authorizer = require('modules/authorizers/asgs');
let route = require('modules/helpers/route');
let _ = require('lodash');

module.exports = [

  route.get('/:account/asgs/:name/launchconfig').inOrderTo('Get the Launch Config of an ASG')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  }).do((request, response) => {
    var query = {
      name: 'GetLaunchConfiguration',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
    };

    send.query(query, request, response);
  }),

  route.post('/:account/asgs/:name/launchconfig').inOrderTo('Update the Launch Config of an ASG')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  })
  .withAuthorizer(authorizer)
  .do((request, response) => {
    var query = {
      name: 'SetLaunchConfiguration',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
      data: request.body,
    };

    send.query(query, request, response);
  })

];
