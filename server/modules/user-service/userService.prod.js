/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let ms = require('ms');
let jsonwebtoken = require('jsonwebtoken');
let guid = require('uuid/v1');
let co = require('co');
let User = require('../user');
let UserRolesProvider = require('../userRolesProvider');
let activeDirectoryAdapter = require('../active-directory-adapter');
let logger = require('../logger');
let md5 = require('md5');
let UserSessionStore = require('../userSessionStore');
let Promise = require('bluebird');
let SslComponentsRepository = require('../sslComponentsRepository');

let userRolesProvider = new UserRolesProvider();

module.exports = function UserService() {
  let sslComponentsRepository = new SslComponentsRepository();

  this.authenticateUser = authenticateUser;
  this.createTokenForUser = createTokenForUser;
  this.getUserByToken = getUserByToken;
  this.signOut = signOut;

  function createTokenForUser(user, duration) {
    return co(function* () {
      let permissions = yield userRolesProvider.getPermissionsFor(_.union([user.name], user.groups));
      let session = {
        sessionId: guid(),
        user: User.new(user.name, getExpiration(ms(duration)), user.groups, permissions).toJson()
      };
      yield storeSession(session, 'direct', ms(duration));
      return yield createSessionToken(session, duration);
    }).catch((err) => {
      logger.error(err);
      throw err;
    });
  }

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
        sessionId: guid(),
        user: User.new(name, expiration, groups, permissions)
      };
    });
  }

  function signOut(encryptedToken) {
    return co(function* () {
      let token = yield readToken(encryptedToken);
      return yield deleteSessionFromStore(token.sessionId);
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
        // TODO: Look into whether can upgrade this algorithm
        algorithm: 'RS256',
        expiresIn: duration
      };
      let token = { sessionId: session.sessionId };

      return createSignedWebToken(token, sslComponents.privateKey, options);
    });
  }

  function getUserByToken(encryptedToken) {
    return co(function* () {
      let token = yield readToken(encryptedToken);
      let session = yield getSessionFromStore(token.sessionId);
      return User.parse(session.user);
    });
  }

  function readToken(encryptedToken) {
    return co(function* () {
      let sslComponents = yield sslComponentsRepository.get();
      let options = {
        algorithm: 'RS256',
        ignoreExpiration: false
      };
      return verifyAndDecryptWebToken(encryptedToken, sslComponents.certificate, options);
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

  function deleteSessionFromStore(sessionId) {
    return co(function* () {
      let sessionKey = getSessionKey(sessionId);
      let store = yield getStore();
      return yield store.del(sessionKey);
    });
  }

  function getStore() {
    return UserSessionStore.get();
  }

  function getSessionKey(sessionId) {
    return `session-${sessionId}`;
  }

  function getLatestSessionIdForUserAndScope(username, scope) {
    return `latest-${scope}-session-${md5(username)}`;
  }
};
