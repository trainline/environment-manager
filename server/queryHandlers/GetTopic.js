/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let assertContract = require('modules/assertContract');
let snsTopicClientFactory = require('modules/clientFactories/snsTopicClientFactory');

module.exports = function GetTopicQueryHandler(query) {
  assertContract(query, 'query', {
    properties: {
      accountName: { type: String, empty: false },
      topicName: { type: String, empty: false },
    },
  });

  return snsTopicClientFactory
    .create({ accountName: query.accountName })
    .then(client => client.get({ topicName: query.topicName }));
};
