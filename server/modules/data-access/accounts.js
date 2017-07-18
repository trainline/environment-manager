/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'InfraConfigAccounts';

let masterAccountSettings = require('config').getUserValue('local').masterAccount;

let getHostAccount = require('queryHandlers/GetAWSHostAccount');
let physicalTableName = require('modules/awsResourceNameProvider').getTableName;
let singleAccountDynamoTable = require('modules/data-access/singleAccountDynamoTable');
let dynamoTable = require('modules/data-access/dynamoTable');
let co = require('co');

let table = singleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), dynamoTable);

function scan() {
  return co(function*() {
    let storedAccounts = yield table.scan();
    let hostAccount = yield getHostAccount();

    let masterAccount;

    let accounts = storedAccounts.map((storedAccount) => {
      let isMaster = storedAccount.AccountNumber === hostAccount.id;

      let account = {
        AccountName: storedAccount.AccountName,
        AccountNumber: storedAccount.AccountNumber,
        RoleArn: storedAccount.RoleArn || undefined,
        IncludeAMIs: storedAccount.IncludeAMIs,
        IsMaster: isMaster,
        IsProd: isMaster,
        Impersonate: !isMaster,
        Audit: storedAccount.Audit
      };

      if (account.IsMaster) {
        masterAccount = account;
      }

      return account;
    });

    console.log('**************************************')
    console.log(accounts)

    if(masterAccountSettings.allowUse && !masterAccount) {
      accounts.push({
        AccountName: 'Master',
        AccountNumber: hostAccount.id,
        IncludeAMIs: !!masterAccountSettings.includeAMIs,
        IsMaster: true,
        IsProd: true,
        Impersonate: false
      });
    }

    return accounts;
  });
}

module.exports = {
  create: table.create,
  delete: table.delete,
  get: table.get,
  put: table.put,
  query: table.query,
  replace: table.replace,
  scan: scan,
  update: table.update
};