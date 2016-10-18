/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');

module.exports = [
  route.get('/environments/:environment/servers')
  .inOrderTo('Get the current status of servers for an environment')
  .withDocs({ tags: ['Environments'] })
  .do((request, response) => {
    let query = {
      name: 'ScanServersStatus',
      accountName: request.query.account,
      environmentName: request.params.environment,
      filter: request.query,
    };

    send.query(query, request, response);
  }),
  route.get('/environments/:environment/servers/:asgName')
  .inOrderTo('Get the current status of ASG for an environment')
  .withDocs({ tags: ['Environments'] })
  .do((request, response) => {
    let query = {
      name: 'GetASGState',
      accountName: request.query.account,
      environmentName: request.params.environment,
      asgName: request.params.asgName,
    };

    send.query(query, request, response);
  }),
];
