/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let express = require('express');
let router = express.Router();
let assert = require('assert');
let remoteCacheFlush = require('modules/remoteCacheFlush');
let logger = require('modules/logger');

router.post('/:environment', (req, res) => {
  assert(req.body.hosts);

  const hosts = req.body.hosts;
  const environment = req.params.environment;

  logger.info(`Request to reset cache in ${environment} by user ${req.user.getName()}`);

  remoteCacheFlush.flush(environment, hosts)
    .then(() => res.status(200).send('[cachereset::success]'))
    .catch(e => res.status(400).send('[cachereset::error]: ', e.message));
});

module.exports = {
  router
};
