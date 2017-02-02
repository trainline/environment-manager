/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

require('app-module-path').addPath(__dirname);

let config = require('config/');

let logger = require('modules/logger');

// TODO conver to singleton
let ConfigurationProvider = require('modules/configuration/ConfigurationProvider');
let checkAppPrerequisites = require('modules/checkAppPrerequisites');
let cacheManager = require('modules/cacheManager');
let co = require('co');
require('./globals');

process.on('unhandledRejection', (reason, promise) => {
  logger.warn('Promise rejection was unhandled. ', reason);
});

let servers;

function start() {
  co(function* () {
    let configurationProvider = new ConfigurationProvider();
    yield configurationProvider.init();
    yield cacheManager.flush();

    if (config.getUserValue('masterAccountName') === undefined) {
      logger.error('No Master account found. Check the Accounts Dynamo Table.');
      process.exit(1);
    }

    yield checkAppPrerequisites();
    config.logBootstrapValues();

    let mainServer = require('modules/MainServer');
    yield mainServer.start();
  }).catch((error) => {
    if (error !== undefined && error.stack !== undefined) {
      console.error(error.stack);
    }
  });
}

function stop() {
  servers.forEach(server => server.stop());
}

if (require.main === module) {
  start();
}

module.exports = {
  start,
  stop
};
