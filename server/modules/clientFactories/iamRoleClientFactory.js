/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assertContract = require('modules/assertContract');
let IAMRoleClient = require('modules/clientFactories/IAMRoleClient');

module.exports = {
  create(parameters) {
    assertContract(parameters, 'parameters', {
      properties: {
        accountName: { type: String, empty: false },
      },
    });

    return new Promise((resolve) => {
      let client = new IAMRoleClient(parameters.accountName);
      resolve(client);
    });
  },
};
