/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = {
  name: 'config/environmenttypes',
  type: 'dynamodb/table',
  tableName: 'ConfigEnvironmentTypes',
  keyName: 'EnvironmentType',
  queryable: true,
  editable: true,
  enableAuditing: true,
  exportable: true,
  importable: true,
  docs: {
    description: 'Environment Type',
    tags: ['Environment Types']
  }
};
