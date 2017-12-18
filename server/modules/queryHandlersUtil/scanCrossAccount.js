/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let sender = require('../sender');
let scanCrossAccountFn = require('./scanCrossAccountFn');

function scanCrossAccount(query, simpleScanQueryName) {
  function queryAccount(account) {
    let childQuery = Object.assign({ name: simpleScanQueryName, accountName: account.AccountName }, query);
    return sender.sendQuery({ query: childQuery, parent: query });
  }
  return scanCrossAccountFn(queryAccount);
}

module.exports = scanCrossAccount;
