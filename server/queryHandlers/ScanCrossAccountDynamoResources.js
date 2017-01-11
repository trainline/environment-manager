/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let scanCrossAccount = require('modules/queryHandlersUtil/scanCrossAccount');

module.exports = function ScanCrossAccountDynamoResources(query) {
  return scanCrossAccount(query, 'ScanDynamoResources');
};
