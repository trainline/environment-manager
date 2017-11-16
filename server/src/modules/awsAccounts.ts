/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

import Account from '../models/Account';
import * as assert from 'assert';
import * as ResourceNotFoundError from './errors/ResourceNotFoundError.class';
import { scan } from './data-access/accounts';

function getByName(accountName: string) {
  let matches = (val: string) => `${accountName}`.toLowerCase() === `${val}`.toLowerCase();

  return Promise.resolve()
    .then(() => { assert(typeof accountName === 'number' || typeof accountName === 'string', `${accountName}`); })
    .then(getAllAccounts)
    .then((accounts) => {
      let matchingAccounts = [
        ...accounts.filter(account => matches(account.AccountNumber)),
        ...accounts.filter(account => matches(account.AccountName))
      ];

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

function getAllAccounts(): Promise<Account[]> {
  return scan();
}

export {
  getAllAccounts as all,
  getByName,
  getAMIsharingAccounts
};
