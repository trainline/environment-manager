/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let co = require('co');
let awsAccounts = require('modules/awsAccounts');

function AccountResource(accounts) {
  var _data = {
    accounts: accounts.map(account => account.AccountName),
  };

  this.all = () => Promise.resolve(_data.accounts);
}

function* create(resourceDescriptor, parameters) {
  let accounts = yield awsAccounts.all();
  let resource = new AccountResource(accounts);

  return resource;
}

function canCreate(resourceDescriptor) {
  return resourceDescriptor.type.toLowerCase() === 'account';
}

module.exports = {
  canCreate: canCreate,
  create: co.wrap(create),
};
