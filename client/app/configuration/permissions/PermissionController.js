/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration').controller('PermissionController',
  function ($routeParams, $location, $q, resources, cachedResources, modal, permissionsValidation) {
    var vm = this;

    var RETURN_PATH = '/config/permissions';

    function init() {

      var name = $routeParams['member'];
      vm.editMode = name.toLowerCase() !== 'new';

      var access = vm.editMode ? 'PUT' : 'POST';
      var resource = vm.editMode ? name : '*';
      vm.userHasPermission = user.hasPermission({ access: access, resource: '/config/permissions/' + resource });

      if (vm.editMode) {
        readItem(name);
      } else {
        vm.member = {};
      }

    }

    vm.validateJson = permissionsValidation;

    vm.canUser = function () {
      return vm.userHasPermission;
    };

    vm.cancel = navigateToList;

    vm.save = function () {
      var saveMethod = vm.editMode ? resources.config.permissions.put : resources.config.permissions.post;
      vm.member.Permissions = JSON.parse(vm.permissions);
      var params = {
        key: vm.member.Name,
        expectedVersion: vm.version,
        data: vm.member,
      };
      saveMethod(params).then(function () {
        navigateToList();
      });
    };

    function readItem(name) {
      resources.config.permissions.get({ key: name }).then(function (data) {
        vm.dataFound = true;
        vm.member = data;
        vm.permissions = JSON.stringify(data.Permissions, null, 2);
        vm.version = data.Version;
      }, function (err) {

        vm.dataFound = false;
      });
    }

    function navigateToList() {
      $location.path(RETURN_PATH);
    }

    init();

  });