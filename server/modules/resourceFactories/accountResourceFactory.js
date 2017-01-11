/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let awsAccounts = require('modules/awsAccounts');

function AccountResource(accounts) {
  let data = {
    accounts: accounts.map(account => account.AccountName),
  };

  this.all = () => Promise.resolve(data.accounts);
}

function* create(resourceDescriptor, parameters) {
  let accounts = yield awsAccounts.all();
  return new AccountResource(accounts);
}

function canCreate(resourceDescriptor) {
  return resourceDescriptor.type.toLowerCase() === 'account';
}

module.exports = {
  canCreate,
  create: co.wrap(create),
};
