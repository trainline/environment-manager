/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let async = require('async');
let _ = require('lodash');
let ms = require('ms');
let jsonwebtoken = require('jsonwebtoken');
let guid = require('node-uuid');
let co = require('co');
let User = require('modules/user');
let config = require('config');
let sender = require('modules/sender');
let userRolesProvider = new (require('modules/userRolesProvider'))();
let activeDirectoryAdapter = require('modules/active-directory-adapter');
let logger = require('modules/logger');
let sessionCache = {};

module.exports = function UserService() {
  let sslComponentsRepository = new (require('modules/sslComponentsRepository'))();

  this.authenticateUser = authenticateUser;
  this.getUserByToken = getUserByToken;


  function authenticateUser(credentials, duration) {
    return co(function* () {
      if (!credentials.scope) {
        logger.warn(`credentials.scope unspecified; using "api": username=${credentials.username}.`);
      }

      let scope = credentials.scope || 'api';

      // Calls the ActiveDirectory adapter to authorize current user by its
      // credentials.
      let activeDirectoryUser = yield activeDirectoryAdapter.authorizeUser(credentials);

      let name = activeDirectoryUser.name;
      let groups = activeDirectoryUser.roles;
      let roles = userRolesProvider.getFromActiveDirectoryGroupMembership(
        activeDirectoryUser.roles
      );

      let user = yield userRolesProvider.getPermissionsFor(_.union([name], groups)).then((permissions) => {
        let expiration = getExpiration(duration);
        return User.new(name, roles, expiration, groups, permissions);
      }).catch((err) => {
        logger.error(err);
        throw err;
      });

      let session = yield storeUserSession(user, scope);
      return yield createSessionToken(session, duration);
    });
  }

  function createSessionToken(session, duration) {
    return co(function* () {
      // Loads SSL components from the repository because next function needs
      // to the private key to create the user token
      let sslComponents = yield sslComponentsRepository.get();

      // Given the user data creates its encoded token
      let options = {
        algorithm: 'RS256',
        expiresIn: duration,
      };

      let sessionToken = {
        scope: session.scope,
        sessionId: session.sessionId,
        userName: session.user.name,
      };

      return jsonwebtoken.sign(sessionToken, sslComponents.privateKey, options);
    });
  }

  function getUserByToken(token) {
    // TODO(filip): remove async use
    return new Promise((resolve, reject) => {
      let mainCallback = (err, result) => {
        if (err) reject(err);
        else resolve(result);
      };

      async.waterfall([
        // Loads SSL components from the repository because next function needs
        // to the certificate to decode the user token
        (callback) => {
          sslComponentsRepository.get().then(result => callback(null, result))
            .catch(error => callback(error));
        },

        // Given encoded token creates the user data
        (sslComponents, callback) => {
          let options = {
            algorithm: 'RS256',
            ignoreExpiration: false,
          };

          jsonwebtoken.verify(token, sslComponents.certificate, options, callback);
        },

        (token, callback) => {
          getUserSessionByToken(token, callback);
        },

        (session, callback) => {
          callback(null, User.parse(session.user));
        },
      ], mainCallback);
    });
  }

  function getExpiration(duration) {
    duration = ms(duration);
    let dateNow = new Date();
    let dateEnd = new Date(dateNow.setMilliseconds(dateNow.getMilliseconds() + duration));

    return dateEnd.getTime();
  }

  function storeUserSession(user, scope) {
    const masterAccountName = config.getUserValue('masterAccountName');

    return new Promise((resolve, reject) => {
      let callback = (err, result) => {
        if (err) reject(err);
        else resolve(result);
      };

      let newSession = {
        scope,
        sessionId: guid.v1(),
        user: user.toJson(),
      };

      let userSessionKey = getSessionKeyForUser(user.getName(), scope);

      getUserSessionFromDb(userSessionKey, (err, dbSession) => {
        let commandName = (err || !dbSession) ? 'CreateDynamoResource' : 'UpdateDynamoResource';

        sender.sendCommand({
          command: {
            name: commandName,
            resource: 'user-sessions',
            accountName: masterAccountName,
            item: {
              UserName: userSessionKey,
              Value: newSession,
            },
          },
          user,
        }).then(
          () => {
            sessionCache[userSessionKey] = newSession;
            callback(null, newSession);
          },

          error => callback(error)
        );
      });
    });
  }

  function getUserSessionByToken(token, callback) {
    if (!token.userName) {
      callback('Token error');
      return;
    }

    if (!token.scope) {
      callback('Token error');
      return;
    }

    let userSessionKey = getSessionKeyForUser(token.userName, token.scope);
    let expectedSessionId = token.sessionId;

    let cachedSession = sessionCache[userSessionKey];

    if (cachedSession && cachedSession.sessionId == expectedSessionId) {
      callback(null, cachedSession);
    } else {
      getUserSessionFromDb(userSessionKey, (err, dbSession) => {
        if (err) {
          logger.warn(`Error getting session from database: userSessionKey="${userSessionKey}"`);
          callback(err);
          return;
        }

        if (!dbSession) {
          logger.warn(`Session does not exist: userSessionKey="${userSessionKey}"`);
          callback('No session found.');
          return;
        }

        if (dbSession.Value.sessionId !== expectedSessionId) {
          logger.warn(`Expected sessionId ${expectedSessionId} but got ${dbSession.Value.sessionId}: userSessionKey="${userSessionKey}"`);
          callback('No session found.');
          return;
        }

        sessionCache[userSessionKey] = dbSession.Value;
        callback(null, dbSession.Value);
      });
    }
  }

  function getUserSessionFromDb(userSessionKey, callback) {
    const masterAccountName = config.getUserValue('masterAccountName');
    let query = {
      name: 'GetDynamoResource',
      key: userSessionKey,
      resource: 'user-sessions',
      accountName: masterAccountName,
    };

    sender.sendQuery({ query }, callback);
  }
};

function getSessionKeyForUser(username, scope) {
  return `${username}/${scope}`;
}
