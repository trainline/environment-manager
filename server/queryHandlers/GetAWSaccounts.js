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
    let accounts = {
      master: yield getHostAccount(),
      others: yield getAwsAccounts(query)
    };

    return _.union([accounts.master], accounts.others);
  });
};
