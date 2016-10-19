/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

function getHealthcheck(req, res, next) {
  // TODO(filip): implement some sanity checks - Redis, dynamodb, consul
  res.json({ok: true}).catch(next);
}

module.exports = {
  getHealthcheck
};
