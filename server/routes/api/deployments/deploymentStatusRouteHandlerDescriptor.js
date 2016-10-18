/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');

module.exports = route.get('/:account/deployments/:key')
  .inOrderTo('Get the current status of a deployment')
  .withDocs({ description: 'Deployment', tags: ['Deployments'] })
  .do((request, response) => {
    let query = {
      name: 'GetDeploymentStatus',
      key: request.params.key,
      account: request.params.account,
    };

    send.query(query, request, response);
  });
