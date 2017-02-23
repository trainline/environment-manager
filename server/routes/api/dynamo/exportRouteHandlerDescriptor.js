/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let make = require('modules/utilities').make;
let resourceDescriptorProvider = require('modules/resourceDescriptorProvider');
let awsAccounts = require('modules/awsAccounts');

module.exports = resourceDescriptorProvider
  .all()
  .filter(resource => resource.type === 'dynamodb/table')
  .filter(resource => resource.disableAutoRoute !== true)
  .filter(resource => !!resource.exportable)
  .map((resource) => {
    let url = make([
      resource.perAccount ? ':account' : null,
      resource.name,
      'export'
    ]).uri();

    let docs;
    if (resource.docs) {
      docs = _.clone(resource.docs);
      docs.verb = 'export';
      docs.perAccount = resource.perAccount;
    }

    return route
      .get(url)
      .named(resource.name)
      .withDocs(docs)
      .do((request, response) => {
        awsAccounts.getMasterAccountName()
          .then((masterAccountName) => {
            let query = {
              name: 'ScanDynamoResources',
              resource: resource.name,
              exposeAudit: 'full',
              accountName: resource.perAccount ? request.params.account : masterAccountName
            };

            send.query(query, request, response);
          });
      });
  });
