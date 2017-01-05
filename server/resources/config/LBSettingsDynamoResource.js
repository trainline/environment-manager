/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let authorizer = require('modules/authorizers/load-balancer-settings');

module.exports = {
  name: 'config/lbsettings',
  type: 'dynamodb/table',
  authorizer: authorizer,
  tableName: 'ConfigLBSettings',
  keyName: 'EnvironmentName',
  rangeName: 'VHostName',
  queryable: true,
  perAccount: true,
  editable: true,
  enableAuditing: true,
  exportable: true,
  importable: true,
  docs: {
    description: 'Load Balancer Settings',
    tags: ["Load Balancer Settings"]
  }
};
