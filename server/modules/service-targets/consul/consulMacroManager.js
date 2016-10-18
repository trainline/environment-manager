/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let assert = require('assert');
let ConsulManager = require('./ConsulManager');
let co = require('co');
let consulClient = require('modules/consul-client');

function* setInstanceMaintenanceMode(accountName, host, environment, enable) {
  let options = { accountName, host, environment };
  let consulManager = yield consulClient.create(options).then(client => new ConsulManager(client));

  yield consulManager.setServerMaintenanceMode(enable);
}

module.exports = {
  setInstanceMaintenanceMode: co.wrap(setInstanceMaintenanceMode),
};
