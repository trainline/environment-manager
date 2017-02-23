/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let make = require('modules/utilities').make;
let awsAccounts = require('modules/awsAccounts');
let resourceDescriptorProvider = require('modules/resourceDescriptorProvider');

module.exports = resourceDescriptorProvider
  .all()
  .filter(resource => resource.type === 'dynamodb/table')
  .filter(resource => resource.disableAutoRoute !== true)
  .filter(resource => !!resource.editable)
  .map((resource) => {
    let url = make([resource.perAccount ? ':account' : null,
      resource.name,
      resource.keyName ? ':key' : null,
      resource.rangeName ? ':range' : null
    ]).uri();

    let docs;
    if (resource.docs) {
      docs = _.clone(resource.docs);
      docs.perAccount = resource.perAccount;
    }

    return route
      .put(url)
      .named(resource.name)
      .withDocs(docs)
      .withAuthorizer(resource.authorizer)
      .do((request, response) => {
        awsAccounts.getMasterAccountName()
          .then((masterAccountName) => {
            let command = {
              name: 'UpdateDynamoResource',
              resource: resource.name,
              key: request.params.key,
              range: request.params.range,
              item: request.body,
              expectedVersion: request.headers['expected-version'],
              accountName: resource.perAccount ? request.params.account : masterAccountName
            };

            send.command(command, request, response);
          });
      });
  });
