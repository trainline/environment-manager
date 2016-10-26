/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let config = require('config');

function getAwsAccounts(query) {
  const masterAccountName = config.getUserValue('masterAccountName');

  let sender = require('modules/sender');
  let dynamoQuery = {
    name: 'ScanDynamoResources',
    resource: 'config/accounts',
    accountName: masterAccountName
  };
  let childQuery = { query:dynamoQuery, parent:query };
  if (query.user) childQuery.user = query.user;

  return sender.sendQuery(childQuery);
}

module.exports = getAwsAccounts;