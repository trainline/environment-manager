/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');

module.exports = [

  route.get('/:account/asgs/:name/scaling-schedule').inOrderTo('Get the Scheduled Scaling Actions of an ASG')
  .withDocs({
    description: 'Auto Scaling Group',
    perAccount: true,
    tags: ['Auto Scaling Groups'],
  }).do((request, response) => {
    let query = {
      name: 'GetAutoScalingGroupScheduledActions',
      accountName: request.params.account,
      autoScalingGroupName: request.params.name,
    };

    send.query(query, request, response);
  }),

];
