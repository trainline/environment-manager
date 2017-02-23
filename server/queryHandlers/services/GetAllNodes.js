/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let serviceDiscovery = require('modules/service-discovery');

module.exports = function GetAllNodes(query) {
  return serviceDiscovery.getAllNodes(query.environment);
};
