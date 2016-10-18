/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');

module.exports = route.get('/:account/environments/:environment/roles/')
  .inOrderTo('List all roles within an environment and the services they contain')
  .withDocs({ tags: ['Services'] })
  .do((request, response) => {
    let query = {
      name: 'GetServiceRoles',
      accountName: request.params.account,
      environmentName: request.params.environment,
    };

    send.query(query, request, response);
  });
