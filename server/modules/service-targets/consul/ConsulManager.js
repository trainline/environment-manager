/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let Promise = require('bluebird');
let logger = require('modules/logger');

module.exports = class ConsulManager {
  constructor(client) {
    this.client = client;
  }

  setServerMaintenanceMode(enable) {
  	logger.debug(`consul: setting maintenance mode to ${enable}`);
  	let promisified = Promise.promisify(this.client.agent.maintenance, { context: this.client.agent });
  	return promisified({ enable, reason: 'Maintanance mode triggered from EnvironmentManager' }).catch((err) => {
    throw new Error(`Couldn't connect to consul client: ${err.message}`);
  });
  }
};
