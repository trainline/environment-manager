/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let {
  getAllServices,
  getService,
  getServiceHealth,
  getAllNodes,
  getNodesForService,
  getNode,
  getNodeHealth
} = require('./consulCatalog');

module.exports = {
  getAllServices,
  getService,
  getServiceHealth,
  getAllNodes,
  getNodesForService,
  getNode,
  getNodeHealth
};
