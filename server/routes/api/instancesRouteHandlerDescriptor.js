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
    var query = {
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
    var query = {
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
    var query = {
      name: 'ScanInstances',
      accountName: request.params.account,
      filter: utilities.extractQuery(request),
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
    var query = {
      name: 'ScanInstances',
      accountName: request.params.account,
      filter: utilities.extractQuery(request),
    };

    query.filter = query.filter || {};
    query.filter['tag:Environment'] = request.params.environment;

    send.query(query, request, response);
  }),
];
