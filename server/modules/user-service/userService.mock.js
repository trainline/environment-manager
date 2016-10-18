/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let ms = require('ms');
let User = require('modules/user');
let utils = require('modules/utilities');

let ActiveDirectoryError = require('modules/errors/ActiveDirectoryError.class');

module.exports = function UserService() {
  this.authenticateUser = (credentials, duration) => {
    if (!credentials.username) {
      return Promise.reject(new Error('User must belong to "corp" domain.'));
    }

    let name = credentials.username.toLowerCase().replace('corp\\', '');
    let roles = ['view', 'toggle', 'edit'];
    let groups = [];
    let permissions = [{ Access: 'ADMIN', Resource: '**' }];
    let expiration = getExpiration(duration);
    let user = User.new(name, roles, expiration, groups, permissions);

    let userJson = JSON.stringify(user.toJson());
    return Promise.resolve(new Buffer(userJson).toString('base64'));
  };

  this.getUserByToken = (token) => {
    let userJson = new Buffer(token, 'base64').toString('utf8');
    let data = utils.safeParseJSON(userJson);

    if (!data) return Promise.reject(new ActiveDirectoryError('Wrong cookie'));

    return Promise.resolve(User.new(data.name, data.roles, data.expiration, data.groups, data.permissions));
  };
};


function getExpiration(duration) {
  duration = ms(duration);

  let dateNow = new Date();
  let dateEnd = new Date(dateNow.setMilliseconds(dateNow.getMilliseconds() + duration));

  return dateEnd.getTime();
}
