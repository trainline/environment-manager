/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = {
  name: 'config/clusters',
  type: 'dynamodb/table',
  tableName: 'InfraConfigClusters',
  keyName: 'ClusterName',
  queryable: true,
  editable: true,
  enableAuditing: true,
  exportable: true,
  importable: true,
  docs: {
    description: 'Cluster',
    tags: ['Clusters']
  }
};
