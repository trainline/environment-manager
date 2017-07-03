'use strict';

let co = require('co');
let permissionsDb = require('modules/data-access/permissions');
let logger = require('modules/logger');
let guid = require('uuid/v1');
let config = require('config');

function checkAppPrerequisites() {
  return co(function* () {
    logger.info('Checking app prerequisites..');

    let permissionsExist = yield checkIfPermissionsExist();

    if (!permissionsExist) {
      yield insertDefaultAdminPermission();
    }

    logger.info('App prerequisites satisfied.');
  });
}

function checkIfPermissionsExist() {
  return co(function* () {
    let results = yield permissionsDb.scan({ Limit: 1 });
    return !!(results && results.length);
  });
}

function insertDefaultAdminPermission() {
  return co(function* () {
    logger.info('Inserting default admin permission.');
    let localConfig = config.getUserValue('local');
    let defaultAdmin = localConfig.authentication.defaultAdmin;

    if (!defaultAdmin) {
      throw new Error('The value "authentication.defaultAdmin" was not found in config. This is required to create the first permission.');
    }

    yield permissionsDb.create({
      record: {
        Name: defaultAdmin,
        Permissions: [{ Resource: '**', Access: 'ADMIN' }]
      },
      metadata: {
        TransactionID: guid(),
        User: 'system'
      }
    });
  });
}

// eslint-disable-next-line arrow-body-style
module.exports = () => {
  return co(function* () {
    return checkAppPrerequisites();
  });
};
