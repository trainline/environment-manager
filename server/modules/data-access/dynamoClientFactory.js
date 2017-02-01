/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let childAccountClient = require('modules/amazon-client/childAccountClient');
let masterAccountClient = require('modules/amazon-client/masterAccountClient');
let myIdentity = require('modules/amazon-client/myIdentity');

function forAccount(factoryFunctionName) {
  return account => myIdentity().then(({ Account }) => {
    if (account === null || account === undefined || account === Account) {
      return masterAccountClient[factoryFunctionName]();
    } else {
      return childAccountClient[factoryFunctionName](account);
    }
  });
}

module.exports = {
  DynamoDB: forAccount('createLowLevelDynamoClient'),
  DocumentClient: forAccount('createDynamoClient')
};
