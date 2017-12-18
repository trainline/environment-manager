/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/* eslint-disable */
/**
 * TODO: This file is used across both client and server.
 * Not only is this a bad idea but it makes it impossible to lint.
 * We should refactor the shared aspects of this module.
 */

var User = function(data) {

  var _data = {
    name: null,
    expiration: 0
  };

  if(data) {
    _data.name       = data.name || null;
    _data.groups     = data.groups || [];
    _data.expiration = data.expiration || 0;
    _data.permissions = data.permissions || [];
  }

  this.getName = function() {
    return _data.name;
  };

  this.getExpiration = function() {
    return _data.expiration;
  };

  this.isAnonymous = function() {
    return !!_data.name;
  };

  this.getPermissions = function () {
    return _data.permissions;
  };

  this.hasPermission = function (requiredPermission) {
    return _data.permissions.some(function(userPermission) {
      if (userPermission.Resource && userPermission.Access) {
        var matchingResources = globIntersection(requiredPermission.resource.toLowerCase(), userPermission.Resource.toLowerCase());
        var matchingAccess = (userPermission.Access.toLowerCase() == requiredPermission.access.toLowerCase()) || userPermission.Access == 'ADMIN';

        if (matchingAccess && matchingResources) {
          return true;
        }
      }
    });
  };

  this.getGroups = function () {
    return _data.groups;
  };

  this.toString = function() {
    return [_data.name, _data.expiration].join('|');
  };

  this.toJson = function() {
    return _data;
  };

};

User.prototype.toString = function() { return 'User'; };

if(typeof module !== 'undefined' && module.exports) {

  module.exports = {

    anonymous: function() {
      return new User();
    },

    new: function(name, expiration, groups, permissions) {
      return new User({
        name: name,
        expiration: expiration,
        groups: groups,
        permissions: permissions
      });
    },

    parse: function(json) {
      if(!json) return new User();

      var user = new User({
        name: json.name,
        expiration: json.expiration,
        groups: json.groups,
        permissions: json.permissions
      });

      return user;
    }
  }
}