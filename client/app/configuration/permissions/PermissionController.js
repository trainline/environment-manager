/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration').controller('PermissionController',
  function ($routeParams, $http, $location, $q, resources, cachedResources, modal, permissionsValidation) {
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
      var saveMethod = vm.editMode ? 'put' : 'post';
      var url = '/api/v1/config/permissions';
      var data;
      if (saveMethod === 'put') {
        url += '/' + vm.member.Name;
        data = vm.member;
      } else {
        data = vm.member;
      }
      vm.member.Permissions = JSON.parse(vm.permissions);
      // var params = {
      //   key: vm.member.Name,
      //   data: vm.member,
      // };
      $http({
        method: saveMethod,
        url: url,
        data: data,
        headers: { 'expected-version': vm.version }
      }).then(function() {
        navigateToList();
      });
    };

    function readItem(name) {
      $http.get('/api/v1/config/permissions/' + name).then(function (response) {
        var data = response.data;
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