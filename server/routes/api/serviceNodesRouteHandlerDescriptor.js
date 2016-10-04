/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');

const DISABLE_SERVICE_MODEL = {
  name: 'body',
  in: 'body',
  required: true,
  schema: {
    type: 'object',
    properties: {
      slice: { type: 'String' },
      serverRole: { type: 'String' },
      environment: { type: 'String' }
    }
  }
};

let getServiceNodes = route.get('/:account/environments/:environment/services/:service/nodes')
  .inOrderTo('Get nodes in the environment which are hosting this service')
  .withDocs({ tags: ['Services'] })
  .do((request, response) => {
    var query = {
      name: 'GetServiceNodes',
      accountName: request.params.account,
      environment: request.params.environment,
      serviceName: request.params.service,
    };
    send.query(query, request, response);
  });

let disableService = route.post('/services/disable/:service')
  .inOrderTo('Disable a service from future deployments')
  .withDocs({ tags:['Services'] })
  .parameters(DISABLE_SERVICE_MODEL)
  .do((req, res) => {
    let serverRole = req.body.serverRole;
    let environment = req.body.environment;
    let slice = req.body.slice;
    let service = req.params.service;
    let name = 'DisableTargetState';

    send.command({name, service, environment, slice, serverRole}, req, res)
  });


module.exports = [getServiceNodes, disableService];
