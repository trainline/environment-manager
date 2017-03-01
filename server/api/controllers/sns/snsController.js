/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const AWS = require('aws-sdk');
const util = require('util');

// configure AWS
AWS.config.update({
  region: process.env.EM_AWS_REGION,
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});

require('modules/amazon-client/masterAccountClient').createSNSClient()
  .then((snsClient) => {
    snsClient.createTopic({
      Name: 'demo'
    }, (err, result) => {
      if (err !== null) {
        console.log(util.inspect(err));
      }

      console.log(util.inspect(result));
    });
  });
