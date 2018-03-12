/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let config = require('../../../config');
const clusterNode = require('../../../modules/clusterNode');

function getHealthcheck(req, res) {
  res.json({
    OK: true,
    Version: config.get('APP_VERSION'),
    Leader: clusterNode.isLeader()
  });
}

module.exports = {
  getHealthcheck
};
