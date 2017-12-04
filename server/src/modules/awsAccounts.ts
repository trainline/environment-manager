"use strict";

import * as assert from "assert";
import IAccount from "../models/Account";
import { scan } from "./data-access/accounts";
import * as ResourceNotFoundError from "./errors/ResourceNotFoundError.class";

function getByName(accountName: string) {
  const matches = (val: string) => `${accountName}`.toLowerCase() === `${val}`.toLowerCase();

  return Promise.resolve()
    .then(() => { assert(typeof accountName === "number" || typeof accountName === "string", `${accountName}`); })
    .then(getAllAccounts)
    .then((accounts) => {
      const matchingAccounts = [
        ...accounts.filter((account) => matches(account.AccountNumber)),
        ...accounts.filter((account) => matches(account.AccountName)),
      ];

      if (matchingAccounts.length > 0) {
        return matchingAccounts[0];
      } else {
        throw new ResourceNotFoundError(`AWS account ${accountName} not found`);
      }
    });
}

function getAMIsharingAccounts() {
  return getAllAccounts().then((accounts) => accounts.filter((a) => a.IncludeAMIs).map((a) => a.AccountNumber));
}

function getAllAccounts(): Promise<IAccount[]> {
  return scan();
}

export {
  getAllAccounts as all,
  getByName,
  getAMIsharingAccounts,
};
