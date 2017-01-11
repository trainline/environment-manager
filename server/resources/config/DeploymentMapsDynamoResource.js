/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = {
  name: 'config/deploymentmaps',
  type: 'dynamodb/table',
  tableName: 'ConfigDeploymentMaps',
  keyName: 'DeploymentMapName',
  queryable: true,
  editable: true,
  enableAuditing: true,
  exportable: true,
  importable: true,
  docs: {
    description: 'Deployment Map',
    tags: ['Deployment Maps'],
  },
};
