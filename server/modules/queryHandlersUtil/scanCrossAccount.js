/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let co = require('co');
let awsAccounts = require('../awsAccounts');
let sender = require('../sender');

function* scanCrossAccount(handler, query, simpleScanQueryName) {
  assert(typeof handler === 'function');
  let results = [];
  let accounts = yield awsAccounts.all();
  for (let account of accounts) {
    let childQuery = Object.assign({}, query);
    childQuery.name = simpleScanQueryName;
    childQuery.accountName = account.AccountName;

    let items = yield sender.sendQuery(handler, { query: childQuery, parent: query });

    items.forEach((item) => {
      item.AccountName = account.AccountName;
    });

    results = results.concat(items);
  }

  return results;
}

module.exports = co.wrap(scanCrossAccount);
