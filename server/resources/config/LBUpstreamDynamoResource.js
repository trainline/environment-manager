/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let authorizer = require('modules/authorizers/upstreams');

module.exports = {
  name: 'config/lbupstream',
  authorizer: authorizer,
  type: 'dynamodb/table',
  tableName: 'ConfigLBUpstream',
  keyName: 'key',
  queryable: true,
  perAccount: true,
  editable: true,
  enableAuditing: true,
  exportable: true,
  importable: true,
  docs: {
    description: 'Upstream',
    tags: ['Upstreams']
  }
};
