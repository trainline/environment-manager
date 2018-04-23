/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let ms = require('ms');
let User = require('../user');
let utils = require('../utilities');
let ActiveDirectoryError = require('../errors/ActiveDirectoryError.class');

function createTokenForUser(user, duration) {
  let permissions = [{ Access: 'ADMIN', Resource: '**' }];
  let expiration = getExpiration(duration);
  let userJson = JSON.stringify(User.new(user.name, expiration, user.groups, permissions).toJson());
  return Promise.resolve(new Buffer(userJson).toString('base64'));
}

function authenticateUser(credentials, duration) {
  if (!credentials.username) {
    return Promise.reject(new Error('User must belong to "corp" domain.'));
  }
  let name = credentials.username.toLowerCase().replace('corp\\', '');
  let groups = [];
  let permissions = [{ Access: 'ADMIN', Resource: '**' }];
  let expiration = getExpiration(duration);
  let user = User.new(name, expiration, groups, permissions);
  let userJson = JSON.stringify(user.toJson());
  return Promise.resolve(new Buffer(userJson).toString('base64'));
}

function getUserByToken(token) {
  let userJson = new Buffer(token, 'base64').toString('utf8');
  let data = utils.safeParseJSON(userJson);
  if (!data) return Promise.reject(new ActiveDirectoryError('Wrong cookie'));
  return Promise.resolve(User.new(data.name, data.expiration, data.groups, data.permissions));
}

function signOut() {
  return Promise.resolve();
}

function getExpiration(duration) {
  let durationMs = ms(duration);
  let dateNow = new Date();
  let dateEnd = new Date(dateNow.setMilliseconds(dateNow.getMilliseconds() + durationMs));
  return dateEnd.getTime();
}

module.exports = {
  createTokenForUser,
  authenticateUser,
  getUserByToken,
  signOut
};
