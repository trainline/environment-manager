/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let co = require('co');
let _ = require('lodash');
let getHostAccount = require('queryHandlers/GetAWSHostAccount');

function getAwsAccounts(query) {
  let sender = require('modules/sender');
  let dynamoQuery = {
    name: 'ScanDynamoResources',
    resource: 'config/accounts'
  };
  let childQuery = { query: dynamoQuery, parent: query };
  if (query.user) childQuery.user = query.user;

  return sender.sendQuery(childQuery);
}

module.exports = (query) => {
  return co(function*() {
    let storedAccounts = yield getAwsAccounts(query);
    let hostAccount = yield getHostAccount();

    let accounts = storedAccounts.map((account) => {
      let isMaster = account.AccountNumber === hostAccount.id;
      return {
        AccountName: account.AccountName,
        AccountNumber: account.AccountNumber,
        RoleArn: account.RoleArn || undefined,
        IncludeAMIs: account.IncludeAMIs,
        IsMaster: isMaster,
        IsProd: isMaster,
        Impersonate: !isMaster
      };
    });

    if(!accounts.some(account => account.AccountNumber === hostAccount.id)) {
      accounts.push({
        AccountName: 'Master',
        AccountNumber: hostAccount.id,
        IncludeAMIs: false,
        IsMaster: true,
        IsProd: true,
        Impersonate: false
      });
    }

    return accounts;

  });
};
