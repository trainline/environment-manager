/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const LOGICAL_TABLE_NAME = 'InfraAsgIPs';

let { createDynamoClient: DocumentClient } = require('../amazon-client/childAccountClient');
let { getTableName: physicalTableName } = require('../awsResourceNameProvider');

const commonParams = Object.freeze({ TableName: physicalTableName(LOGICAL_TABLE_NAME) });

function get(account, key) {
  let params = Object.assign({ Key: key }, commonParams);
  return DocumentClient(account)
    .then(dynamo => dynamo.get(params).promise())
    .then(({ Item }) => Item);
}

function put(account, item) {
  let params = Object.assign({ Item: item }, commonParams);
  return DocumentClient(account)
    .then(dynamo => dynamo.put(params).promise());
}

module.exports = {
  get,
  put
};
