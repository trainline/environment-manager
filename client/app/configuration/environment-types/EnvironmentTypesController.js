/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

// Manage all environment types
angular.module('EnvironmentManager.configuration').controller('EnvironmentTypesController',
  function ($scope, $routeParams, $location, $log, resources, cachedResources, modal) {
    var vm = $scope;

    vm.Data = [];

    function init() {
      vm.canPost = user.hasPermission({ access: 'POST', resource: '/config/environmenttypes/*' });
      $log.log('Initialising Environment Types Controller');
      vm.Refresh();
    }

    vm.NewItem = function () {
      $location.path('/config/environmenttypes/new');
    };

    vm.Refresh = function () {
      vm.dataLoading = true;
      resources.config.environmentTypes.all().then(function (data) {
        vm.Data = data;
        vm.canDelete = false;
        $log.warn(data);
        for (var prop in data) {
          var envType = data[prop];
          var canDelete = user.hasPermission({ access: 'DELETE', resource: '/config/environmenttypes/' + envType.EnvironmentType });
          if (canDelete) {
            vm.canDelete = true;
            break;
          }
        }
        vm.dataLoading = false;
      });
    };

    vm.canUser = function (action) {
      if (action == 'post') return vm.canPost;
      if (action == 'delete') return vm.canDelete;
    };

    vm.Delete = function (envType) {
      var name = envType.EnvironmentType;
      modal.confirmation({
        title: 'Deleting an Environment Type',
        message: 'Are you sure you want to delete the <strong>' + name + '</strong> Environment Type?',
        action: 'Delete',
        severity: 'Danger'
      }).then(function () {
        resources.config.environmentTypes.delete({ key: name }).then(vm.Refresh);
        cachedResources.config.environmentTypes.flush();
      });
    };

    vm.ViewHistory = function (envType) {
      vm.ViewAuditHistory('Environment Type', envType.EnvironmentType);
    };

    init();
  });

