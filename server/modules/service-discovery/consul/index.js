/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let {
  getAllServices,
  getService,
  getAllNodes,
  getNode,
  getNodeHealth,
} = require('./consulCatalog');

module.exports = {
  getAllServices,
  getService,
  getAllNodes,
  getNode,
  getNodeHealth,
};
