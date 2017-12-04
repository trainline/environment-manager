/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let ResourceNotFoundError = require('./errors/ResourceNotFoundError.class');
let { scan } = require('./data-access/accounts');

function getByName(accountName) {
  let matches = val => `${accountName}`.toLowerCase() === `${val}`.toLowerCase();

  return Promise.resolve()
    .then(() => { assert(typeof accountName === 'number' || typeof accountName === 'string', `${accountName}`); })
    .then(getAllAccounts)
    .then((accounts) => {
      let matchingAccounts = [].concat(
        accounts.filter(account => matches(account.AccountNumber)),
        accounts.filter(account => matches(account.AccountName))
      );

      if (matchingAccounts.length > 0) {
        return matchingAccounts[0];
      } else {
        throw new ResourceNotFoundError(`AWS account ${accountName} not found`);
      }
    });
}

function getAMIsharingAccounts() {
  return getAllAccounts().then(accounts => accounts.filter(a => a.IncludeAMIs).map(a => a.AccountNumber));
}

function getAllAccounts() {
  return scan();
}

module.exports = {
  all: getAllAccounts,
  getByName,
  getAMIsharingAccounts
};
