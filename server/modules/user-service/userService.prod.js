/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let ms = require('ms');
let jsonwebtoken = require('jsonwebtoken');
let guid = require('node-uuid');
let co = require('co');
let User = require('modules/user');
let userRolesProvider = new (require('modules/userRolesProvider'))();
let activeDirectoryAdapter = require('modules/active-directory-adapter');
let logger = require('modules/logger');
let md5 = require('md5');
let EncryptedRedisStore = require('modules/data-access/encryptedRedisStore');
let Promise = require('bluebird');

module.exports = function UserService() {
  let sslComponentsRepository = new (require('modules/sslComponentsRepository'))();
  let redisStore;

  this.authenticateUser = authenticateUser;
  this.getUserByToken = getUserByToken;

  function authenticateUser(credentials, duration) {
    return co(function* () {
      let scope = credentials.scope || 'api';
      let durationInMillis = ms(duration);
      let expiration = getExpiration(durationInMillis);

      let userSession = yield authenticate(credentials, expiration, scope);

      let session = {
        sessionId: userSession.sessionId,
        user: userSession.user.toJson(),
        password: md5(credentials.password)
      };

      yield storeSession(session, scope, durationInMillis);
      return yield createSessionToken(session, duration);
    }).catch((err) => {
      logger.error(err);
      throw err;
    });
  }

  function authenticate(credentials, expiration, scope) {
    return co(function* () {
      let session = yield getExistingSessionForUser(credentials, scope);

      if (session) {
        if (session.password === md5(credentials.password)) {
          return {
            sessionId: session.sessionId,
            user: User.parse(session.user)
          };
        }
      }

      let activeDirectoryUser = yield activeDirectoryAdapter.authorizeUser(credentials);

      let name = activeDirectoryUser.name;
      let groups = activeDirectoryUser.roles;
      let permissions = yield userRolesProvider.getPermissionsFor(_.union([name], groups));

      return {
        sessionId: guid.v1(),
        user: User.new(name, expiration, groups, permissions)
      };
    });
  }

  function getExistingSessionForUser(credentials, scope) {
    return co(function* () {
      let store = yield getStore();
      let userScopeSessionKey = getLatestSessionIdForUserAndScope(credentials.username, scope);
      let sessionId = yield store.get(userScopeSessionKey);
      if (sessionId) {
        return yield getSessionFromStore(sessionId);
      }
      return null;
    });
  }

  function createSessionToken(session, duration) {
    return co(function* () {
      let sslComponents = yield sslComponentsRepository.get();

      let options = {
        algorithm: 'RS256',
        expiresIn: duration
      };

      let token = { sessionId: session.sessionId };

      return createSignedWebToken(token, sslComponents.privateKey, options);
    });
  }

  function getUserByToken(encryptedToken) {
    return co(function* () {
      let sslComponents = yield sslComponentsRepository.get();
      let options = {
        algorithm: 'RS256',
        ignoreExpiration: false
      };
      let token = yield verifyAndDecryptWebToken(encryptedToken, sslComponents.certificate, options);

      let session = yield getSessionFromStore(token.sessionId);
      return User.parse(session.user);
    });
  }

  let createSignedWebToken = jsonwebtoken.sign;
  let verifyAndDecryptWebToken = Promise.promisify(jsonwebtoken.verify);

  function getExpiration(durationMs) {
    let dateNow = new Date();
    let dateEnd = new Date(dateNow.setMilliseconds(dateNow.getMilliseconds() + durationMs));
    return dateEnd.getTime();
  }

  function storeSession(session, scope, duration) {
    return co(function* () {
      let store = yield getStore();
      yield store.psetex(getSessionKey(session.sessionId), duration, session);
      yield store.psetex(getLatestSessionIdForUserAndScope(session.user.name, scope), duration, session.sessionId);
    });
  }

  function getSessionFromStore(sessionId) {
    return co(function* () {
      let sessionKey = getSessionKey(sessionId);
      let store = yield getStore();
      return yield store.get(sessionKey);
    });
  }

  function getSessionKey(sessionId) {
    return `session-${sessionId}`;
  }

  function getLatestSessionIdForUserAndScope(username, scope) {
    return `latest-${scope}-session-${md5(username)}`;
  }

  function getStore() {
    return co(function* () {
      if (redisStore) {
        return redisStore;
      }

      redisStore = yield EncryptedRedisStore.create();
      return redisStore;
    });
  }
};
