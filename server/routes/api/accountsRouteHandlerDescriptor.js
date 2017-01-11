/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');

module.exports = route.get('/accounts')
  .inOrderTo('List all accounts')
  .withDocs({ description: 'Account', tags: ['Accounts'] })
  .do((request, response) => {
    let query = {
      name: 'ScanAccounts'
    };

    send.query(query, request, response);
  });
