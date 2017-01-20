/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration').factory('permissionsValidation',
  function () {
    return function (permissions) {
      if (!Array.isArray(permissions)) {
        return ['Must be a javascript array'];
      }

      var errors = [];

      permissions.forEach(function (permission, index) {
        var i = index + 1;

        try {
          var attributes = Object.keys(permission);
          var validAttributes = ['Resource', 'Access', 'Cluster', 'EnvironmentType', 'Clusters', 'EnvironmentTypes'];

          attributes.forEach(function (attr) {
            if (!_.includes(validAttributes, attr)) {
              errors.push('Unknown attribute "' + attr + '" on permission ' + i);
            }
          });

          var validTypes = ['Resource', 'Cluster', 'EnvironmentType'];

          if (!_.some(attributes, function (attr) { return _.includes(validTypes, attr); })) {
            errors.push('Permission ' + i + ' is not a known type (should contain a Resource, Cluster, or EnvironmentType attribute)');
          }

          if (permission.Resource) {
            var validAccessTypes = ['POST', 'PUT', 'DELETE', 'ADMIN'];

            if (!permission.Access) {
              errors.push('"Access" value of permission ' + i + ' is missing');
            } else if (!_.includes(validAccessTypes, permission.Access)) {
              errors.push('"Access" of permission ' + i + ' must be one of ' + validAccessTypes);
            }

            var restrictionAttributes = ['Clusters', 'EnvironmentTypes'];

            var attributeIsPresent = function (restrictionAttr) {
              return _.includes(attributes, restrictionAttr);
            };

            var noRestrictionAttributesAreUsed = !_.some(restrictionAttributes, attributeIsPresent);
            var allRestrictionAttributesAreUsed = _.every(restrictionAttributes, attributeIsPresent);

            if (!(noRestrictionAttributesAreUsed || allRestrictionAttributesAreUsed)) {
              errors.push('Permission ' + i + ' must contain both "Clusters" and "EnvironmentTypes" attributes or neither');
            }

            restrictionAttributes.forEach(function (attr) {
              var attributeValue = permission[attr];
              if (attributeValue && !(Array.isArray(attributeValue) || attributeValue.toLowerCase() === 'all')) {
                errors.push(attr + ' attribute on permission ' + i + ' must be a javascript array or "all"');
              }
            });
          }
        } catch (err) {
          errors.push('An error occurred evaluating permission ' + i);
        }
      });

      if (errors.length > 0) return errors;
    };
  });

