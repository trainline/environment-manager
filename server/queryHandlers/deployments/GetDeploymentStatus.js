/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let deployments = require('modules/queryHandlersUtil/deployments-helper');

module.exports = function GetDeploymentStatusQueryHandler(query) {
  return deployments.get(query);
};
