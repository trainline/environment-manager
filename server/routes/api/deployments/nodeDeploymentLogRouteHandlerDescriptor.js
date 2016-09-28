/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');

module.exports = route.get('/:account/deployments/:environment/:deploymentId/nodes/:node/log')
  .inOrderTo('Get the deployment log of a particular node')
  .withDocs({ tags: ['Deployments'] })
  .do((request, response) => {
    var query = {
      name: 'GetNodeDeploymentLog',
      account: request.params.account,
      environment: request.params.environment,
      deploymentId: request.params.deploymentId,
      node: request.params.node,
    };

    send.query(query, request, response);
  });
