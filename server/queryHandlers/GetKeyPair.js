/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assertContract = require('modules/assertContract');
let keypairFactory = require('modules/factories/keypairFactory');

module.exports = function GetKeyPairQueryHandler(query) {
  assertContract(query, 'query', {
    properties: {
      accountName: { type: String, empty: false },
      keyName: { type: String, empty: false },
    },
  });

  let parameters = { accountName: query.accountName };
  return keypairFactory.create(parameters)
    .then(resource => resource.get({ keyName: query.keyName }));
};
