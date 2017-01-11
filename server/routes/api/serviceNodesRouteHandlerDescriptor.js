/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');

const TOGGLE_SERVICE_STATUS_MODEL = {
  name: 'body',
  in: 'body',
  required: true,
  schema: {
    type: 'object',
    properties: {
      slice: { type: 'String' },
      serverRole: { type: 'String' },
      environment: { type: 'String' },
    },
  },
};

let getServiceNodes = route.get('/:account/environments/:environment/services/:service/nodes')
  .inOrderTo('Get nodes in the environment which are hosting this service')
  .withDocs({ tags: ['Services'] })
  .do((request, response) => {
    let query = {
      name: 'GetServiceNodes',
      environment: request.params.environment,
      serviceName: request.params.service,
    };
    send.query(query, request, response);
  });

let disableService = route.post('/services/disable/:service')
  .inOrderTo('Disable a service from future deployments')
  .withDocs({ tags: ['Services'] })
  .parameters(TOGGLE_SERVICE_STATUS_MODEL)
  .do((req, res) => {
    let serverRole = req.body.serverRole;
    let environment = req.body.environment;
    let slice = req.body.slice;
    let service = req.params.service;
    let enable = false;
    let name = 'ToggleTargetStatus';

    send.command({ name, service, environment, slice, serverRole, enable }, req, res);
  });

let enableService = route.post('/services/enable/:service')
  .inOrderTo('Enable future deployments of a service')
  .withDocs({ tags: ['Services'] })
  .parameters(TOGGLE_SERVICE_STATUS_MODEL)
  .do((req, res) => {
    let serverRole = req.body.serverRole;
    let environment = req.body.environment;
    let slice = req.body.slice;
    let service = req.params.service;
    let enable = true;
    let name = 'ToggleTargetStatus';

    send.command({ name, service, environment, slice, serverRole, enable }, req, res);
  });

module.exports = [getServiceNodes, disableService, enableService];
