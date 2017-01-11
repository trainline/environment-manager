/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

module.exports = {
  name: 'config/notification-settings',
  type: 'dynamodb/table',
  tableName: 'ConfigNotificationSettings',
  keyName: 'NotificationSettingsId',
  rangeName: null,
  queryable: true,
  editable: true,
  enableAuditing: true,
  exportable: true,
  importable: true,
  docs: {
    description: 'Notification Settings',
    tags: ['Notification Settings'],
  },
};
