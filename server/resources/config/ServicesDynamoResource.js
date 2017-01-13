/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let authorizer = require('modules/authorizers/services');

module.exports = {
  name: 'config/services',
  authorizer,
  type: 'dynamodb/table',
  tableName: 'ConfigServices',
  keyName: 'ServiceName',
  rangeName: 'OwningCluster',
  queryable: true,
  editable: true,
  enableAuditing: true,
  exportable: true,
  importable: true,
  docs: {
    description: 'Service',
    tags: ['Services']
  }
};
