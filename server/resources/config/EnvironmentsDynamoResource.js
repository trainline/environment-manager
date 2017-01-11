/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let authorizer = require('modules/authorizers/environments');

module.exports = {
  name: 'config/environments',
  authorizer,
  type: 'dynamodb/table',
  tableName: 'ConfigEnvironments',
  keyName: 'EnvironmentName',
  queryable: true,
  editable: true,
  enableAuditing: true,
  exportable: true,
  importable: true,
  docs: {
    description: 'Environment',
    tags: ['Environments'],
  },
};
