/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const util = require('util');

// configure AWS
// AWS.config.update({
//   region: process.env.EM_AWS_REGION,
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
// });

module.exports = {
  createSNSTopic(req, res, next) {
    require('modules/amazon-client/masterAccountClient').createSNSClient()
      .then((snsClient) => {
        snsClient.createTopic({
          Name: 'Demo'
        }, (err, result) => {
          if (err !== null) {
            return res.send(util.inspect(err));
          }
          return res.send(util.inspect(result));
        });
      });
  }
};
