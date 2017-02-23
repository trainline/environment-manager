/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

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

module.exports = getAwsAccounts;
