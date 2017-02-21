/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let sender = require('modules/sender');
let awsAccounts = require('modules/awsAccounts');
let accountValidator = require('../validators/awsAccountValidator');

function RemoveAWSAccount(command) {
  try {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let accountNumber = +command.accountNumber;
        accountValidator.validateAccountNumber(accountNumber);

        let dynamoCommand = {
          name: 'DeleteDynamoResource',
          resource: 'config/accounts',
          key: accountNumber,
          accountName: masterAccountName
        };
        return sender.sendCommand({ command: dynamoCommand, parent: command }).then(awsAccounts.flush);
      });
  } catch (error) {
    return Promise.reject(error);
  }
}

module.exports = RemoveAWSAccount;
