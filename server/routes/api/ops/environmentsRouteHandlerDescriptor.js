/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let authorizer = require('modules/authorizers/environments-schedule');
let config = require('config');

module.exports = route.put('/ops/environments/:key')
  .withDocs({ disableDocs: true })
  .withAuthorizer(authorizer)
  .do((request, response) => {
    const masterAccountName = config.getUserValue('masterAccountName');
    let command = {
      name: 'UpdateDynamoResource',
      resource: 'ops/environments',
      key: request.params.key,
      item: request.body,
      expectedVersion: request.headers['expected-version'],
      accountName: masterAccountName,
    };

    send.command(command, request, response);
  });
