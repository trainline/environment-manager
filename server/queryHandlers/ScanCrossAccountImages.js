/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let scanCrossAccount = require('modules/queryHandlersUtil/scanCrossAccount');

module.exports = function ScanCrossAccountImages(query) {
  return scanCrossAccount(query, 'ScanImages');
};
