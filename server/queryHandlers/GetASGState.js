/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

let _ = require('lodash');
let co = require('co');
let logger = require('modules/logger');
let sender = require('modules/sender');
let getASGState = require('modules/environment-state/getASGState');

module.exports = function GetServerState(query) {
  return getASGState(query.accountName, query.environmentName, query.asgName);
};