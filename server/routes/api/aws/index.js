/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let send = require('modules/helpers/send');
let route = require('modules/helpers/route');
let awsAccounts = require('modules/awsAccounts');

const GET_PATH = '/aws/accounts';
const WRITE_PATH = '/aws/account';
const GET_DESCRIPTION = 'Get all associated AWS accounts';
const POST_DESCRIPTION = 'Add an AWS account';
const PUT_DESCRIPTION = 'Update an AWS account';
const DELETE_DESCRIPTION = 'Remove an AWS account';
const DOCUMENTATION = { description: 'AWS', tags: ['AWS'] };
const WRITE_ACCEPTS = 'application/json';

/**
 * Schema for creating / updating Accounts
 */
const WRITE_ACCOUNT_MODEL = {
  name: 'account',
  in: 'body',
  required: true,
  schema: {
    type: 'object',
    required: ['AccountName', 'AccountNumber', 'IsProd', 'IsMaster', 'Impersonate'],
    properties: {
      AccountName: { type: 'String' },
      AccountNumber: { type: 'Integer' },
      IsProd: { type: 'Boolean' },
      IsMaster: { type: 'Boolean' },
      Impersonate: { type: 'Boolean' },
    },
  },
};

/**
 * Params schema for deleting accounts
 */
const DELETE_ACCOUNT_PARAM = {
  name: 'accountNumber',
  in: 'query',
  required: true,
  type: 'integer',
  maxLength: 12,
  minLength: 12,
};

function requestAccounts(req, res) {
  awsAccounts.all().then(res.json.bind(res));
}

function addAccount(req, res) {
  let command = {
    name: 'AddAWSaccount',
    data: req.body,
    user: req.user,
  };
  send.command(command, req, res);
}

function updateAccount(req, res) {
  let command = {
    name: 'UpdateAWSaccount',
    data: req.body,
    user: req.user,
  };
  send.command(command, req, res);
}

function removeAccount(req, res) {
  let command = {
    name: 'RemoveAWSaccount',
    accountNumber: req.query.accountNumber,
    user: req.user,
  };
  send.command(command, req, res);
}

let getAccounts = route
  .get(GET_PATH)
  .inOrderTo(GET_DESCRIPTION)
  .withDocs(DOCUMENTATION)
  .do(requestAccounts);

let postAccount = route
  .post(WRITE_PATH)
  .inOrderTo(POST_DESCRIPTION)
  .withDocs(DOCUMENTATION)
  .consumes(WRITE_ACCEPTS)
  .parameters(WRITE_ACCOUNT_MODEL)
  .do(addAccount);

let putAccount = route
  .put(WRITE_PATH)
  .inOrderTo(PUT_DESCRIPTION)
  .withDocs(DOCUMENTATION)
  .consumes(WRITE_ACCEPTS)
  .parameters(WRITE_ACCOUNT_MODEL)
  .do(updateAccount);

let deleteAccount = route
  .delete(WRITE_PATH)
  .inOrderTo(DELETE_DESCRIPTION)
  .withDocs(DOCUMENTATION)
  .consumes(WRITE_ACCEPTS)
  .parameters(DELETE_ACCOUNT_PARAM)
  .do(removeAccount);

module.exports = [getAccounts, postAccount, putAccount, deleteAccount];
