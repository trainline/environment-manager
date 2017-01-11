/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let route = require('modules/helpers/route');
let send = require('modules/helpers/send');
let utilities = require('modules/utilities');
let deployments = require('modules/queryHandlersUtil/deployments-helper');

module.exports = route.get('/all/deployments')
  .inOrderTo('Get all deployments')
  .withDocs({ description: 'Deployment', tags: ['Deployments'] })
  .do((request, response) => {
    let adapt = require('modules/callbackAdapter');
    let callback = adapt.callbackToExpress(request, response);

    return deployments.scan({
      filter: utilities.extractQuery(request),
    }).then(value => callback(null, value), err => callback(err));
  });
