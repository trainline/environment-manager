/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

module.exports = {
  name: 'ops/environments',
  type: 'dynamodb/table',
  tableName: 'InfraOpsEnvironment',
  keyName: 'EnvironmentName',
  queryable: true,
  enableAuditing: true,
  docs: { disableDocs: true }
};
