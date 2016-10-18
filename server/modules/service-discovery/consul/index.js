/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let consulCatalog = require('./consulCatalog');

module.exports = {
  getAllServices: consulCatalog.getAllServices,
  getService: consulCatalog.getService,
  getAllNodes: consulCatalog.getAllNodes,
  getNode: consulCatalog.getNode,
  getNodeHealth: consulCatalog.getNodeHealth,
};
