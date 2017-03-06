/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

const publish = require('modules/sns/publish');
const createTopic = require('modules/sns/createTopic');

module.exports = {
  publishConfiguration(req, res, next) {
    const Params = req.swagger.params.body.value.Params;

    // createTopic is an idempotent operation.
    createTopic({ Name: 'EnvironmentManagerConfigurationChange' })
      .then((ResponseMetadata) => {
        Params.TargetArn = ResponseMetadata.TopicArn;
        return publish(Params);
      })
      .then((value) => {
        res.json({ ok: true });
      })
      .catch((err) => {
        res.send(err);
      });
  },

  publishOperations(req, res, next) {
    const Params = req.swagger.params.body.value.Params;

    // createTopic is an idempotent operation.
    createTopic({ Name: 'EnvironmentManagerOperationsChange' })
      .then((ResponseMetadata) => {
        Params.TargetArn = ResponseMetadata.TopicArn;
        return publish(Params);
      })
      .then((value) => {
        res.json({ ok: true });
      })
      .catch((err) => {
        res.send(err);
      });
  }
};
