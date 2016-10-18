/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let User = function (data) {
  let userData = {
    name: null,
    roles: [],
    expiration: 0,
  };

  if (data) {
    userData.name = data.name || null;
    userData.groups = data.groups || [];
    userData.roles = data.roles || [];
    userData.expiration = data.expiration || 0;
    userData.permissions = data.permissions || [];
  }

  this.getName = function () {
    return userData.name;
  };

  this.getExpiration = function () {
    return userData.expiration;
  };

  this.isAuthenticated = function () {
    return userData.roles.length > 0;
  };

  this.isAnonymous = function () {
    return !!userData.name;
  };

  this.isInRole = function (role) {
    return userData.roles.indexOf(role) >= 0;
  };

  this.getPermissions = function () {
    return userData.permissions;
  };

  this.hasPermission = function (requiredPermission) {
    for (let userPermission of userData.permissions) {
      if (userPermission.Resource && userPermission.Access) {
        let matchingResources = globIntersection(requiredPermission.resource.toLowerCase(), userPermission.Resource.toLowerCase());
        let matchingAccess = (userPermission.Access.toLowerCase() === requiredPermission.access.toLowerCase()) || userPermission.Access === 'ADMIN';

        if (matchingAccess && matchingResources) {
          return true;
        }
      }
    }
    return false;
  };

  this.getGroups = function () {
    return userData.groups;
  };

  this.toString = function () {
    return [userData.name, userData.roles.join(';'), userData.expiration].join('|');
  };

  this.toJson = function () {
    return userData;
  };
};

User.prototype.toString = function () {
  return 'User';
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {

    anonymous() {
      return new User();
    },

    new(name, roles, expiration, groups, permissions) {
      return new User({
        name,
        roles,
        expiration,
        groups,
        permissions,
      });
    },

    parse(json) {
      if (!json) return new User();

      return new User({
        name: json.name,
        roles: json.roles,
        expiration: json.expiration,
        groups: json.groups,
        permissions: json.permissions,
      });
    },
  };
}
