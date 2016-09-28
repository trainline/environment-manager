/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration').controller('PermissionController',
  function ($scope, $routeParams, $location, $q, resources, cachedResources, modal, permissionsValidation) {

    var RETURN_PATH = '/config/permissions';

    function init() {

      var name = $routeParams['member'];
      $scope.EditMode = name.toLowerCase() !== 'new';

      var access = $scope.EditMode ? 'PUT' : 'POST';
      var resource = $scope.EditMode ? name : '*';
      $scope.userHasPermission = user.hasPermission({ access: access, resource: '/config/permissions/' + resource });

      if ($scope.EditMode) {
        readItem(name);
      } else {
        $scope.member = {};
      }

    }

    $scope.ValidateJson = permissionsValidation;

    $scope.canUser = function () {
      return $scope.userHasPermission;
    };

    $scope.Cancel = navigateToList;

    $scope.Save = function () {
      var saveMethod = $scope.EditMode ? resources.config.permissions.put : resources.config.permissions.post;
      $scope.member.Permissions = JSON.parse($scope.permissions);
      var params = {
        key: $scope.member.Name,
        expectedVersion: $scope.Version,
        data: $scope.member,
      };
      saveMethod(params).then(function () {
        navigateToList();
      });
    };

    function readItem(name) {
      resources.config.permissions.get({ key: name }).then(function (data) {
        $scope.DataFound = true;
        $scope.member = data;
        $scope.permissions = JSON.stringify(data.Permissions, null, 2);
        $scope.Version = data.Version;
      }, function (err) {

        $scope.DataFound = false;
      });
    }

    function navigateToList() {
      $location.path(RETURN_PATH);
    }

    init();

  });