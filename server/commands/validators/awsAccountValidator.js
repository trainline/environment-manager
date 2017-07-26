/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let childAWSclient = require('modules/amazon-client/childAccountClient');
let logger = require('modules/logger');
let co = require('co');

function validate(account) {
  return co(function* () {
    let flags = ['IncludeAMIs'];
    let required = flags.concat(['AccountName', 'AccountNumber', 'RoleArn']);

    Object.keys(account).forEach((k) => {
      if (required.indexOf(k) < 0) throw new Error(`'${k}' is not a valid attribute.`);
    });

    required.forEach((p) => {
      if (!{}.hasOwnProperty.call(account, p)) throw new Error(`Missing required attribute: ${p}`);
    });

    flags.forEach((f) => {
      if (typeof account[f] !== 'boolean') throw new Error(`Attribute ${f} must be boolean`);
    });

    validateAccountNumber(account.AccountNumber);

    try {
      yield childAWSclient.assumeRole(account.RoleArn);
    } catch (error) {
      logger.error(`Rejected attempt to add account ${account.AccountName} with role ARN ${account.RoleArn}`);
      throw new Error(`Cannot assume role for ARN: ${account.RoleArn}`);
    }

    return true;
  });
}

function validateAccountNumber(accountNumber) {
  if (!Number.isInteger(accountNumber) || String(accountNumber).length !== 12) {
    throw new Error('AccountNumber must be a 12 digit integer');
  }
}

module.exports = { validate, validateAccountNumber };
