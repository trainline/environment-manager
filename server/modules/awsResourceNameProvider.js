/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('config');
let resourcePrefix = config.get('EM_AWS_RESOURCE_PREFIX');

module.exports = {
  getQueueName: queueName => `${resourcePrefix}${queueName}`,
  getTableName: tableName => `${resourcePrefix}${tableName}`
};
