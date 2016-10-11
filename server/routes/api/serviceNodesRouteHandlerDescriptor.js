/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');

module.exports = route.get('/:account/environments/:environment/services/:service/nodes')
  .inOrderTo('Get nodes in the environment which are hosting this service')
  .withDocs({ tags: ['Services'] })
  .do((request, response) => {

    var query = {
      name: 'GetServiceNodes',
      environment: request.params.environment,
      serviceName: request.params.service,
    };

    send.query(query, request, response);

  });
