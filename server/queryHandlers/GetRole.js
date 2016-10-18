/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assertContract = require('modules/assertContract');
let iamRoleClientFactory = require('modules/clientFactories/iamRoleClientFactory');

module.exports = function GetRoleQueryHandler(query) {
  assertContract(query, 'query', {
    properties: {
      accountName: { type: String, empty: false },
      roleName: { type: String, empty: false },
    },
  });

  return iamRoleClientFactory
    .create({ accountName: query.accountName })
    .then(client => client.get({ roleName: query.roleName }));
};
