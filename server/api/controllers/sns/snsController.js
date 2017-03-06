/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const masterAccountClient = require('modules/amazon-client/masterAccountClient');
const SNS = require('models/SNS');

// configure AWS
// AWS.config.update({
//   region: process.env.EM_AWS_REGION,
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
// });

module.exports = {
  produceMessage(req, res, next) {
    const message = req.swagger.params.body.value;
    masterAccountClient.createSnsClent()
      .then((snsClient) => {
        let sns = new SNS(snsClient);
        return sns.produceMessage(message);
      })
      .then(() => {
        res.send({ ok: true });
      });
  }
};
