/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let IAMRoleClient = require('./IAMRoleClient');

module.exports = {
  create(parameters) {
    return new Promise((resolve) => {
      let client = new IAMRoleClient(parameters.accountName);
      resolve(client);
    });
  }
};
