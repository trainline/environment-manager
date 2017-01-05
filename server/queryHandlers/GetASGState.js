/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let getASGState = require('modules/environment-state/getASGState');

module.exports = function GetServerState(query) {
  return getASGState(query.environmentName, query.asgName);
};