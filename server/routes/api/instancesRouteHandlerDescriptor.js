/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let utilities = require('modules/utilities');

module.exports = [
  route.get('/all/instances')
  .withDocs({
    description: 'Instance',
    verb: 'crossScan',
    tags: ['Instances'],
  })
  .withPriority(10).do((request, response) => {
    let query = {
      name: 'ScanCrossAccountInstances',
      filter: utilities.extractQuery(request),
    };

    send.query(query, request, response);
  }),

  route.get('/all/instances/:environment').inOrderTo('List all Instances in all accounts with a particular Environment tag')
  .withDocs({
    description: 'Instance',
    verb: 'crossScan',
    tags: ['Instances'],
  })
  .withPriority(10).do((request, response) => {
    let query = {
      name: 'ScanCrossAccountInstances',
      filter: utilities.extractQuery(request),
    };

    query.filter = query.filter || {};
    query.filter['tag:Environment'] = request.params.environment;

    send.query(query, request, response);
  }),

  route.get('/:account/instances')
  .withDocs({
    description: 'Instance',
    verb: 'scan',
    perAccount: true,
    tags: ['Instances'],
  })
  .do((request, response) => {
    let query = {
      name: 'ScanInstances',
      accountName: request.params.account,
      filter: utilities.extractQuery(request),
    };

    send.query(query, request, response);
  }),

  route.get('/:account/instances/schedule-actions')
  .inOrderTo('List instances changes needed due to scheduling')
  .withDocs({
    disableDocs: true,
  })
  .do((request, response) => {
    let query = {
      name: 'ScanInstancesScheduleStatus',
      accountName: request.params.account,
      filter: utilities.extractQuery(request),
    };

    send.query(query, request, response);
  }),

  route.get('/:account/instances/schedule-actions/:dateTime')
  .inOrderTo('List instances changes needed due to scheduling as of a particular date and time')
  .withDocs({
    disableDocs: true,
  })
  .do((request, response) => {
    let query = {
      name: 'ScanInstancesScheduleStatus',
      accountName: request.params.account,
      filter: utilities.extractQuery(request),
      dateTime: request.params.dateTime,
    };

    send.query(query, request, response);
  }),

  route.get('/:account/instances/:environment').inOrderTo('List all Instances within an account with a particular Environment tag')
  .withDocs({
    description: 'Instance',
    verb: 'scan',
    perAccount: true,
    tags: ['Instances'],
  })
  .do((request, response) => {
    let query = {
      name: 'ScanInstances',
      accountName: request.params.account,
      filter: utilities.extractQuery(request),
    };

    query.filter = query.filter || {};
    query.filter['tag:Environment'] = request.params.environment;

    send.query(query, request, response);
  }),
];
