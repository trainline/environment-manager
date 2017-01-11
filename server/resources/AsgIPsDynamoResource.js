/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = {
  name: 'asgips',
  type: 'dynamodb/table',
  tableName: 'InfraAsgIPs',
  keyName: 'AsgName',
  enableAuditing: false,
  queryable: true,
  perAccount: true,
  editable: true,
  docs: {
    description: 'Auto Scaling Group IPs',
    tags: ['Auto Scaling Groups'],
  },
};
