/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let _ = require('lodash');
let awsAccounts = require('modules/awsAccounts');
let sender = require('modules/sender');

module.exports = function UserRolesProvider() {
  this.getPermissionsFor = (names) => {
    if (!names) {
      return Promise.resolve([]);
    }

    let tasks = names.map(getPermissions);

    return Promise.all(tasks).then((results) => {
      let users = _.flatten(results);
      let permissions = _.flatten(users.map(user => user.Permissions));

      return permissions;
    });
  };

  this.getFromActiveDirectoryGroupMembership = (groupMembership) => {
    let roles = [];

    if (groupMembership.indexOf('GG-APP-EnvironmentManager-ReadOnly') >= 0) {
      addIfMissing(roles, 'view');
    }

    if (groupMembership.indexOf('GG-APP-EnvironmentManager-Toggle') >= 0) {
      addIfMissing(roles, 'view');
      addIfMissing(roles, 'toggle');
    }

    if (groupMembership.indexOf('GG-APP-EnvironmentManager-Editor') >= 0) {
      addIfMissing(roles, 'view');
      addIfMissing(roles, 'toggle');
      addIfMissing(roles, 'edit');
    }

    if (groupMembership.indexOf('GG-APP-EnvironmentManager-Test') >= 0) {
      addIfMissing(roles, 'view');
      addIfMissing(roles, 'toggle');
      addIfMissing(roles, 'edit');
    }

    return roles;
  };

  let addIfMissing = function (roles, roleName) {
    if (roles.indexOf(roleName) >= 0) return;
    roles.push(roleName);
  };

  let getPermissions = function (name) {
    return awsAccounts.getMasterAccountName()
      .then((masterAccountName) => {
        let query = {
          accountName: masterAccountName,
          name: 'ScanDynamoResources',
          resource: 'config/permissions',
          filter: { Name: name }
        };

        return sender.sendQuery({ query });
      });
  };
};
