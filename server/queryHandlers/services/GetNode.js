/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let serviceDiscovery = require('modules/service-discovery');

module.exports = function GetNode(query) {
  return serviceDiscovery.getNode(query.environment, query.nodeName);
};
