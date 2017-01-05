/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let make = require('modules/utilities').make;
let config = require('config');
let resourceDescriptorProvider = require('modules/resourceDescriptorProvider');

module.exports = resourceDescriptorProvider
  .all()
  .filter(resource => resource.type === 'dynamodb/table')
  .filter(resource => resource.disableAutoRoute !== true)
  .map((resource) => {
    var url = make([resource.perAccount ? ':account' : null,
      resource.name,
      resource.keyName ? ':key' : null,
      resource.rangeName ? ':range' : null,
    ]).uri();

    var docs;
    if (resource.docs) {
      docs = _.clone(resource.docs);
      docs.perAccount = resource.perAccount;
    }
    const masterAccountName = config.getUserValue('masterAccountName');
    
    return route
      .get(url)
      .named(resource.name)
      .withDocs(docs)
      .do((request, response) => {
        var query = {
          name: 'GetDynamoResource',
          resource: resource.name,
          key: request.params.key,
          range: request.params.range,
          accountName: resource.perAccount ? request.params.account : masterAccountName,
          exposeAudit: 'version-only',
        };

        send.query(query, request, response);
      });
  });
