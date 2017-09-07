/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let express = require('express');
let router = express.Router();
let assert = require('assert');
let remoteCacheFlush = require('modules/remoteCacheFlush');

router.post('/:environment', (req, res) => {
  assert(req.body.hosts);

  const hosts = req.body.hosts;
  const environment = req.params.environment;

  remoteCacheFlush.flush(environment, hosts)
    .then(() => res.status(200).json({ success: '.../diagnostics/cachereset sent.' }))
    .catch(e => res.status(400).json({ error: e.message }));
});

module.exports = {
  router
};
