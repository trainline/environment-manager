/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');

module.exports = [

  route.get('/:account/consul/catalog/nodes').whenUserCan('view')
  .withDocs({ disableDocs: true })
  .do((request, response) => {
    let query = {
      name: 'GetAllNodes',
      accountName: request.params.account,
      environment: getEnvironmentFrom(request),
    };

    send.query(query, request, response);
  }),

  route.get('/:account/consul/catalog/services/:service').whenUserCan('view')
  .withDocs({ disableDocs: true })
  .do((request, response) => {
    let query = {
      name: 'GetService',
      accountName: request.params.account,
      environment: getEnvironmentFrom(request),
      serviceName: request.params.service,
    };

    send.query(query, request, response);
  }),
];

function getEnvironmentFrom(req) {
  let environment = req.query.environment;
  if (environment) {
    return environment;
  }

  throw new Error('the \'environment\' query string parameter is required.');
}
