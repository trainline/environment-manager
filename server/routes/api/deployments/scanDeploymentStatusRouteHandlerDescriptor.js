/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let deploymentRepository = require('modules/deployment/deploymentRepository');
let route = require('modules/helpers/route');
let send = require('modules/helpers/send');
let utilities = require('modules/utilities');

module.exports = route.get('/all/deployments')
  .inOrderTo('Get all deployments')
  .withDocs({ description: 'Deployment', tags: ['Deployments'] })
  .do((request, response) => {
    let query = {
      name: 'ScanDeploymentStatus',
      filter: utilities.extractQuery(request),
    };

    send.query(query, request, response);
  });
