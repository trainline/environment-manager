/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let EncryptedRedisStore = require('modules/data-access/encryptedRedisStore');
const USER_SESSION_STORE_INDEX = 1;

let sessionStorePromise;

function createSessionStore() {
  sessionStorePromise = EncryptedRedisStore.createStore(USER_SESSION_STORE_INDEX);
  return sessionStorePromise;
}

module.exports = {
  get: () => { return sessionStorePromise || createSessionStore(); }
};
