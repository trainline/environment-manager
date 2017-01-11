/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let scanCrossAccount = require('modules/queryHandlersUtil/scanCrossAccount');

module.exports = function ScanCrossAccountInstances(query) {
  return scanCrossAccount(query, 'ScanInstances');
};
