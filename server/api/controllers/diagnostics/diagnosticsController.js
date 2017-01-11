/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('config');

function getHealthcheck(req, res, next) {
  res.json({ OK: true, Version: config.get('APP_VERSION') }).catch(next);
}

module.exports = {
  getHealthcheck,
};
