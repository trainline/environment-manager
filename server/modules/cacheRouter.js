/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let express = require('express');
let router = express.Router();
let assert = require('assert');
let remoteCacheFlush = require('./remoteCacheFlush');
let cookieAuthentication = require('./authentications/cookieAuthentication');
let logger = require('./logger');

router.post('/:environment', (req, res) => {
  assert(req.body.hosts);

  const hosts = req.body.hosts;
  const environment = req.params.environment;

  cookieAuthentication.middleware(req, res, _ => 0)
    .then(() => {
      logger.info(`Request to reset cache in ${environment} by user ${req.user.getName()}`);
      return remoteCacheFlush.flush(environment, hosts)
        .then(results => res.status(200).json(results));
    })
    .catch(e => res.status(400).send('[cachereset::error]:', e.message));
});

module.exports = {
  router
};
