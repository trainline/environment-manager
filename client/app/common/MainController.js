/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').controller('MainController',
  function ($rootScope, $scope, $route, $routeParams, $location, modal, Environment, environmentDeploy) {
    var vm = this;

    $scope.appVersion = window.version;
    $scope.$route = $route; // Used by index page to determine active section
    $scope.LoggedInUser = window.user.getName(); // For display in header
    $scope.ParentEnvironmentsList = []; // For Environments selection
    $rootScope.WorkingEnvironment = { EnvironmentName: '' }; // For Environments section only, selected Environment from Sidebar drop-down

    function init() {
      Environment.all().then(function (environments) {
        $scope.ParentEnvironmentsList = _.map(environments, 'EnvironmentName').sort();
      }).then(function () {
        if (!$rootScope.WorkingEnvironment.EnvironmentName) $rootScope.WorkingEnvironment.EnvironmentName = $scope.ParentEnvironmentsList[0];
      });
    }

    vm.getSection = function () {
      if ($location.path().indexOf('config') > -1) {
        return 'config';
      } else if ($location.path().indexOf('operations') > -1) {
        return 'operations';
      } else if ($location.path().indexOf('environment') > -1 || $location.path() == '/') {
        return 'environments';
      } else if ($location.path().indexOf('compare') > -1 || $location.path() == '/') {
        return 'compare';
      } else {
        return 'Unknown section';
      }
    };

    // Change active environment for Environments section
    $scope.ChangeEnvironment = function () {
      $location.search('environment', $rootScope.WorkingEnvironment.EnvironmentName);
      $route.reload();
    };

    $scope.ViewAuditHistory = function (entityType, key, range) {
      $location.search('entityType', entityType);
      if (key) { $location.search('key', key); }

      if (range) { $location.search('range', range); }

      $location.path('/config/audit/');
    };

    // Validates JSON object (value) contains only expected attributes
    // TODO: remove once no longer editing JSON in UI?
    $scope.ValidateFields = function (value, mandatoryFields, optionalFields, pathPrefix) {
      var errors = [];

      pathPrefix = (typeof pathPrefix === 'undefined') ? '' : pathPrefix + '/';

      // Check all mandatory fields have been provided
      for (var i = 0; i < mandatoryFields.length; i++) {
        var field = mandatoryFields[i];

        if (!value || !value.hasOwnProperty(field)) {
          errors.push('Missing mandatory field: ' + pathPrefix + field);
        } else if (missingJSONValue(value[field])) {
          errors.push('Mandatory field ' + pathPrefix + field + ' must have a value set');
        }
      }

      // Check for any unexpected values
      for (var field in value) {
        if (mandatoryFields.indexOf(field) === -1 &&
          optionalFields.indexOf(field) === -1) {
          errors.push('Unrecognised field: ' + pathPrefix + field);
        } else if (mandatoryFields.indexOf(field) === -1) {
          if (missingJSONValue(value[field])) {
            errors.push('Attribute ' + pathPrefix + field + ' is optional but must have a value if specified');
          }
        }
      }

      return errors;
    };

    $scope.ValidateArrayField = function (value, fieldName, mandatory, pathPrefix) {
      var errors = [];
      pathPrefix = (typeof pathPrefix === 'undefined') ? '' : pathPrefix + '/';

      if (!Array.isArray(value)) {
        errors.push(pathPrefix + fieldName + ' should be an array');
      } else {
        if (mandatory && value.length == 0) {
          errors.push(pathPrefix + fieldName + ' array cannot be empty');
        }

        for (var i = 0; i < value.length; i++) {
          if (missingJSONValue(value[i])) {
            errors.push(pathPrefix + fieldName + ' must contain valid values');
            break;
          }
        }
      }

      return errors;
    };

    $scope.showDeployDialog = function() {
      environmentDeploy.callDeployHandler();
    }


    function missingJSONValue(value) {
      if (typeof value === 'undefined') return true;
      if (value == null) return false; // nulls allowed
      if (value === false || value === true) return false;
      return !(value);
    }

    $scope.ShowSchemaHelp = function () {
      var DYNAMO_SCHEMA_WIKI_URL = window.links.DYNAMO_CONFIG;
      window.open(DYNAMO_SCHEMA_WIKI_URL, '_blank');
    };

    $rootScope.$on('error', function (event, response) {
      var errorMessage;
      var title = 'Error';
      var errors = _.get(response, ['data', 'errors']);
      if (_.isString(response.data)) {
        errorMessage = response.data;
      } else if (_.isArray(errors)) {
        // Handle errors returned in JSON API format: http://jsonapi.org/format/#errors
        if (errors.length === 1) {
          title = errors[0].title || title;
          errorMessage = errors[0].detail;
        } else {
          title = 'Errors';
          errorMessage = _.join(_.map(errors, function (e) { return '<h2>' + e.title + '</h2><p>' + e.detail; }), '<hr>');
        }
      } else {
        errorMessage = response.data.error;
      }

      if (response.data.details) {
        errorMessage += '<hr>' + angular.toJson(response.data.details);
      }

      modal.error(title, errorMessage);
    });

    $rootScope.$on('cookie-expired', function () {
      function navigateToLogin() { location.reload(); }

      modal.information({
        title: 'Your session has expired',
        message: 'You were signed out of your account. Please press [OK] to sign in to Environment Manager again.',
        severity: 'Info'
      }).then(navigateToLogin, navigateToLogin);
    });

    init();
  });
