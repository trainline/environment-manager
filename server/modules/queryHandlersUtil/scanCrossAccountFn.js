/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let awsAccounts = require('../awsAccounts');
let applyFuncToAccounts = require('./applyFuncToAccounts');

function scanCrossAccountFn(fn) {
  return awsAccounts.all()
    .then(accounts => applyFuncToAccounts(fn, accounts));
}

module.exports = scanCrossAccountFn;
