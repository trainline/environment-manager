/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

if (process.env.NEW_RELIC_APP_NAME !== undefined) {
  // eslint-disable-next-line global-require
  require('newrelic'); // This line must be executed before any other call to require()
}

global.Promise = require('bluebird');

require('app-module-path').addPath(__dirname);

let config = require('config/');

let logger = require('modules/logger');

// TODO conver to singleton
let ConfigurationProvider = require('modules/configuration/ConfigurationProvider');
let checkAppPrerequisites = require('modules/checkAppPrerequisites');
let cacheManager = require('modules/cacheManager');
let co = require('co');
let awsAccounts = require('modules/awsAccounts');

process.on('unhandledRejection', (reason, promise) => {
  logger.warn('Promise rejection was unhandled. ', reason);
});

let servers;

function start() {
  co(function* () { // eslint-disable-line func-names
    let configurationProvider = new ConfigurationProvider();
    yield configurationProvider.init();
    yield cacheManager.flush();
    let masterAccountName = yield awsAccounts.getMasterAccountName();

    if (masterAccountName === undefined) {
      logger.error('No Master account found. Check the Accounts Dynamo Table.');
      process.exit(1);
    }

    yield checkAppPrerequisites();
    config.logBootstrapValues();

    // eslint-disable-next-line global-require
    let mainServer = require('modules/MainServer');
    yield mainServer.start();
  }).catch((error) => {
    if (error !== undefined && error.stack !== undefined) {
      // eslint-disable-next-line no-console
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
