/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let masterAccountClient = require('modules/amazon-client/masterAccountClient');

module.exports = (params) => {
  return masterAccountClient.createSNSClient()
    .then((snsClient) => {
      return new Promise((resolve, reject) => {
        // idempotent operation
        snsClient.createTopic(params, (err, data) => {
          if (err) reject(err);
          else resolve(data);
        });
      });
    });
};
