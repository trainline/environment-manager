/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let iamRoleClientFactory = require('modules/clientFactories/iamRoleClientFactory');

module.exports = function GetRoleQueryHandler(query) {
  return iamRoleClientFactory
    .create({ accountName: query.accountName })
    .then(client => client.get({ roleName: query.roleName }));
};
