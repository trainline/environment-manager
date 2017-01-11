/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

module.exports = {
  name: 'user-sessions',
  type: 'dynamodb/table',
  tableName: 'InfraEnvManagerSessions',
  keyName: 'UserName',
  rangeName: null,
  perAccount: false,
  docs: { disableDocs: true },
};
