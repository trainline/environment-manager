/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

let User = function (data) {
  let _data = {
    name: null,
    roles: [],
    expiration: 0,
  };

  if (data) {
    _data.name = data.name || null;
    _data.groups = data.groups || [];
    _data.roles = data.roles || [];
    _data.expiration = data.expiration || 0;
    _data.permissions = data.permissions || [];
  }

  this.getName = function () {
    return _data.name;
  };

  this.getExpiration = function () {
    return _data.expiration;
  };

  this.isAuthenticated = function () {
    return _data.roles.length > 0;
  };

  this.isAnonymous = function () {
    return !!_data.name;
  };

  this.isInRole = function (role) {
    return _data.roles.indexOf(role) >= 0;
  };

  this.getPermissions = function () {
    return _data.permissions;
  };

  this.hasPermission = function (requiredPermission) {
    for (let userPermission of _data.permissions) {
      if (userPermission.Resource && userPermission.Access) {
        let matchingResources = globIntersection(requiredPermission.resource.toLowerCase(), userPermission.Resource.toLowerCase());
        let matchingAccess = (userPermission.Access.toLowerCase() == requiredPermission.access.toLowerCase()) || userPermission.Access == 'ADMIN';

        if (matchingAccess && matchingResources) {
          return true;
        }
      }
    }
    return false;
  };

  this.getGroups = function () {
    return _data.groups;
  };

  this.toString = function () {
    return [_data.name, _data.roles.join(';'), _data.expiration].join('|');
  };

  this.toJson = function () {
    return _data;
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

      let user = new User({
        name: json.name,
        roles: json.roles,
        expiration: json.expiration,
        groups: json.groups,
        permissions: json.permissions,
      });

      return user;
    },
  };
}
