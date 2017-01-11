/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let utilities = require('modules/utilities');
let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let make = require('modules/utilities').make;
let config = require('config');
let resourceDescriptorProvider = require('modules/resourceDescriptorProvider');

module.exports = resourceDescriptorProvider
  .all()
  .filter(resource => resource.type === 'dynamodb/table')
  .filter(resource => resource.disableAutoRoute !== true)
  .filter(resource => resource.queryable)
  .map((resource) => {
    let url = make([resource.perAccount ? ':account' : null,
      resource.name,
    ]).uri();

    let docs;
    if (resource.docs) {
      docs = _.clone(resource.docs);
      docs.verb = 'scan';
      docs.perAccount = resource.perAccount;
    }
    const masterAccountName = config.getUserValue('masterAccountName');

    return route
      .get(url)
      .named(resource.name)
      .withDocs(docs)
      .do((request, response) => {
        let query = {
          name: 'ScanDynamoResources',
          resource: resource.name,
          filter: utilities.extractQuery(request),
          exposeAudit: 'version-only',
          accountName: resource.perAccount ? request.params.account : masterAccountName,
        };

        send.query(query, request, response);
      });
  });
