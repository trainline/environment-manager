/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let utilities = require('modules/utilities');

module.exports = [

  route.get('/all/images').withPriority(10)
    .withDocs({
      description: 'Image',
      verb: 'crossScan',
      tags: ['Images (AMIs)']
    }).do((request, response) => {
      let query = {
        name: 'ScanCrossAccountImages',
        filter: utilities.extractQuery(request)
      };

      send.query(query, request, response);
    }),

  route.get('/:account/images')
    .withDocs({
      description: 'Image',
      verb: 'scan',
      perAccount: true,
      tags: ['Images (AMIs)']
    }).do((request, response, next) => {
      if (request.params.account === 'v1') {
        next();
        return;
      }

      let query = {
        name: 'ScanImages',
        accountName: request.params.account,
        filter: utilities.extractQuery(request)
      };

      send.query(query, request, response);
    })

];
