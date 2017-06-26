'use strict';

let _ = require('lodash');

let ACCOUNTS_TABLE_NAME = 'em-config-accounts';

exports.all = {
  handler: ({ event, context, dynamo }) => {
    let accountsTable = dynamo.getTable(ACCOUNTS_TABLE_NAME);
    return accountsTable.getAll().then(jsonResponse);
  }
};

exports.get = {
  handler: ({ event, context, dynamo }) => {
    let accountsTable = dynamo.getTable(ACCOUNTS_TABLE_NAME);
    let accountId = Number(event.pathParameters.accountNumber);

    return accountsTable.getItem(accountId).then(jsonResponse);
  }
};

exports.put = {
  handler: ({ event, context, dynamo }) => {
    let accountsTable = dynamo.getTable(ACCOUNTS_TABLE_NAME);
    
    let accountId = Number(event.pathParameters.accountNumber);
    let item = JSON.parse(event.body);

    return accountsTable.putItem(accountId, item).then(() => jsonResponse());
  }
};

function jsonResponse(data) {
  return {
    statusCode: 200,
    body: data ? JSON.stringify(data) : undefined
  };
}