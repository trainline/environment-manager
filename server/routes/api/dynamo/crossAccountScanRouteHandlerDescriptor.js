/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let utilities = require('modules/utilities');
let make = require('modules/utilities').make;
let resourceDescriptorProvider = require('modules/resourceDescriptorProvider');

module.exports = resourceDescriptorProvider
  .all()
  .filter(resource => resource.type === 'dynamodb/table')
  .filter(resource => resource.disableAutoRoute !== true)
  .filter(resource => !!resource.queryable)
  .filter(resource => !!resource.perAccount)
  .map((resource) => {
    let url = make(['all', resource.name]).uri();

    let docs;
    if (resource.docs) {
      docs = _.clone(resource.docs);
      docs.verb = 'crossScan';
      docs.perAccount = resource.perAccount;
    }

    return route
      .get(url)
      .named(resource.name)
      .withDocs(docs)
      .withPriority(10)
      .do((request, response) => {
        let query = {
          name: 'ScanCrossAccountDynamoResources',
          resource: resource.name,
          filter: utilities.extractQuery(request)
        };

        send.query(query, request, response);
      });
  });
