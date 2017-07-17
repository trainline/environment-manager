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

const fp = require('lodash/fp');
const miniStack = require('modules/miniStack');
const mini = miniStack.build();

process.on('unhandledRejection', (err, promise) => {
  let entry;
  if (err instanceof Error) {
    entry = {
      error: {
        message: fp.get(['message'])(err),
        stack: fp.compose(fp.truncate({ length: 1400 }), mini, fp.get(['stack']))(err)
      },
      eventtype: 'UnhandledRejection'
    };
  } else {
    entry = err;
  }

  logger.warn('Promise rejection was unhandled: ', entry);
});

let servers;

function start() {
  co(function* () { // eslint-disable-line func-names
    let configurationProvider = new ConfigurationProvider();
    yield configurationProvider.init();
    yield cacheManager.flush();

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
