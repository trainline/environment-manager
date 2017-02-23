/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let snsTopicClientFactory = require('modules/clientFactories/snsTopicClientFactory');

module.exports = function GetTopicQueryHandler(query) {
  return snsTopicClientFactory
    .create({ accountName: query.accountName })
    .then(client => client.get({ topicName: query.topicName }));
};
