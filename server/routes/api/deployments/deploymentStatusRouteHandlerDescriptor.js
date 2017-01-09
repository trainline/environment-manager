/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let route = require('modules/helpers/route');
let deployments = require('modules/queryHandlersUtil/deployments-helper');

module.exports = route.get('/:account/deployments/:key')
  .inOrderTo('Get the current status of a deployment')
  .withDocs({ description: 'Deployment', tags: ['Deployments'] })
  .do((request, response) => {
    let adapt = require('modules/callbackAdapter');
    let callback = adapt.callbackToExpress(request, response);

    return deployments.get({
      key: request.params.key,
      account: request.params.account,
    }).then((value) => callback(null, value), (err) => callback(err));
  });
