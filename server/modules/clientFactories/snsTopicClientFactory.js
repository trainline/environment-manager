/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let SNSTopicClient = require('modules/clientFactories/SNSTopicClient');

module.exports = {
  create(parameters) {
    return new Promise((resolve) => {
      let client = new SNSTopicClient(parameters.accountName);
      resolve(client);
    });
  }
};
