/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let EncryptedRedisStore = require('modules/data-access/encryptedRedisStore');
const USER_SESSION_STORE_INDEX = 1;

let sessionStore;

function createSessionStore() {
  sessionStore = EncryptedRedisStore.createStore(USER_SESSION_STORE_INDEX);
  return sessionStore;
}

module.exports = {
  get: () => { return sessionStore || createSessionStore(); }
};
