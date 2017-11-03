/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let scanCrossAccount = require('../modules/queryHandlersUtil/scanCrossAccountFn');
let ScanImages = require('./ScanImages');

module.exports = function ScanCrossAccountImages(query) {
  return scanCrossAccount(({ AccountName }) => ScanImages(Object.assign({ accountName: AccountName }, query)));
};
