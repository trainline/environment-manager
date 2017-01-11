/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let make = require('modules/utilities').make;
let resourceDescriptorProvider = require('modules/resourceDescriptorProvider');
let config = require('config');

module.exports = resourceDescriptorProvider
  .all()
  .filter(resource => resource.type === 'dynamodb/table')
  .filter(resource => resource.disableAutoRoute !== true)
  .filter(resource => !!resource.editable)
  .map((resource) => {
    let url = make([resource.perAccount ? ':account' : null,
      resource.name,
      resource.keyName ? ':key' : null,
      resource.rangeName ? ':range' : null,
    ]).uri();

    let docs;
    if (resource.docs) {
      docs = _.clone(resource.docs);
      docs.perAccount = resource.perAccount;
    }
    const masterAccountName = config.getUserValue('masterAccountName');

    return route
      .delete(url)
      .named(resource.name)
      .withAuthorizer(resource.authorizer)
      .withDocs(docs)
      .do((request, response) => {
        let command = {
          name: 'DeleteDynamoResource',
          resource: resource.name,
          key: request.params.key,
          range: request.params.range,
          accountName: resource.perAccount ?
            request.params.account : masterAccountName,
        };

        send.command(command, request, response);
      });
  });
