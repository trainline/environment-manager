/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let scanCrossAccount = require('../modules/queryHandlersUtil/scanCrossAccount');
let ScanInstances = require('./ScanInstances');

module.exports = function ScanCrossAccountInstances(query) {
  return scanCrossAccount(ScanInstances, query, 'ScanInstances');
};
