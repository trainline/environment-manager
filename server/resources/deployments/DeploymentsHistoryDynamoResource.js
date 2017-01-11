/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = {
  name: 'deployments/history',
  type: 'dynamodb/table',
  tableName: 'ConfigDeploymentExecutionStatus',
  keyName: 'DeploymentID',
  perAccount: true,
  queryable: true,
  dateField: {
    name: 'Value.StartTimestamp',
    format: 'ISO',
  },
  docs: {
    disableDocs: true,
  },
};
