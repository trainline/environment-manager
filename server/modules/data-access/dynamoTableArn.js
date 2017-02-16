/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let AWS_REGION = require('config').get('EM_AWS_REGION');
let myIdentity = require('modules/amazon-client/myIdentity');

const TABLE_ARN_REGEX = /^arn:aws:dynamodb:([^:]+):([^:]+):table\/([^\/]+)$/;

function match(i) {
  return (tableArn) => {
    let t = TABLE_ARN_REGEX.exec(tableArn);
    if (t === null) {
      return null;
    } else {
      return t[i];
    }
  };
}

function mkArn({ tableName, account, region }) {
  if (tableName === undefined) {
    return Promise.reject(
      new Error('Cannot construct a DynamoDB table ARN without a table name.')
    );
  }
  return myIdentity()
    .then(id => `arn:aws:dynamodb:${region || AWS_REGION}:${account || id.Account}:table/${tableName}`);
}

module.exports = {
  mkArn,
  account: match(2),
  region: match(1),
  tableName: match(3)
};
