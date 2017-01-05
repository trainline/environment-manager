/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let url = require('url');
let sender = require('modules/sender');
let logger = require('modules/logger');

module.exports = (request, response) => {
  let params = url.parse(request.url, true).query;

  let query = {
    name: 'GetNodeDeploymentLog',
    accountName: params.account,
    environment: params.environment,
    deploymentId: params.deploymentId,
    instanceId: params.node,
  };

  sender.sendQuery({ query: query, user: request.user }).then(data => {
    response.send(data.replace(/\n/g,  '<br />'));
  }).catch(err => {
    response.status(500).send('An error occurred. The log file might not be available. Please see logs for more details.');
    logger.error('Error fetching node deployment log file.', err);
  });
};
