/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let scanCrossAccount = require('../modules/queryHandlersUtil/scanCrossAccount');
let ScanAutoScalingGroups = require('./ScanAutoScalingGroups');

module.exports = function ScanCrossAccountAutoScalingGroups(query) {
  return scanCrossAccount(ScanAutoScalingGroups, query, 'ScanAutoScalingGroups');
};
