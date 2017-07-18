/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'InfraConfigAccounts';

let masterAccountSettings = require('config').getUserValue('local').masterAccount || {};

let getHostAccount = require('queryHandlers/GetAWSHostAccount');
let physicalTableName = require('modules/awsResourceNameProvider').getTableName;
let singleAccountDynamoTable = require('modules/data-access/singleAccountDynamoTable');
let dynamoTable = require('modules/data-access/dynamoTable');
let co = require('co');

let table = singleAccountDynamoTable(physicalTableName(LOGICAL_TABLE_NAME), dynamoTable);

function scan() {
  return co(function* () {
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
        Audit: storedAccount.Audit,
        IsEditable: true
      };

      if (account.IsMaster) {
        masterAccount = account;
      }

      return account;
    });

    if (!masterAccountSettings.disableUse && !masterAccount) {
      masterAccount = {
        AccountName: 'Master',
        AccountNumber: hostAccount.id,
        IncludeAMIs: !!masterAccountSettings.includeAMIs,
        IsMaster: true,
        IsProd: true,
        Impersonate: false
      };
      accounts.unshift(masterAccount);
    }

    masterAccount.IsEditable = !masterAccountSettings.disableChanges;
    return accounts;
  });
}

function change(fn) {
  return (...args) => {
    return co(function* () {
      let hostAccount = yield getHostAccount();
      let isMaster = (args[0].record || args[0].key).AccountNumber === hostAccount.id;

      if (isMaster && masterAccountSettings.disableChanges) {
        throw new Error('Changes to the master account are not permitted');
      }

      return fn(...args);
    });
  };
}

module.exports = {
  scan,
  create: change(table.create),
  delete: change(table.delete),
  replace: change(table.replace)
};
