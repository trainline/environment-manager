/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

// Manage specific service
angular.module('EnvironmentManager.configuration').controller('ServiceController',
  function ($scope, $routeParams, $location, $q, resources, cachedResources, modal, $http) {

    var vm = this;
    var RETURN_PATH = '/config/services';
    var userHasPermission;

    vm.service = {};
    vm.dataFound = false;
    vm.editMode = $routeParams['service'] !== 'new';
    vm.owningClustersList = [];
    vm.serviceNames = [];
    vm.version = 0;

    vm.cancel = navigateToList;

    function init() {

      var serviceName = $routeParams['service'];
      var owningCluster = $routeParams['Range'];
      vm.editMode = serviceName.toLowerCase() !== 'new';

      var access = vm.editMode ? 'PUT' : 'POST';
      var resource = vm.editMode ? name : '*';
      userHasPermission = user.hasPermission({ access: access, resource: '/config/services/' + resource });

      $q.all([
        cachedResources.config.clusters.all().then(function (clusters) {
          vm.owningClustersList = _.map(clusters, 'ClusterName').sort();
        }),

        resources.config.services.all().then(function (services) {
          vm.serviceNames = _.map(services, 'ServiceName');
        }),
      ]).then(function () {

        if (vm.editMode) {
          readItem(serviceName, owningCluster);
        } else {
          vm.service = {
            OwningCluster: vm.owningClustersList[0],
            Value: {
              SchemaVersion: 1
            },
          };
        }

      });
    }

    function readItem(name, range) {
      resources.config.services.get({ key: name, range: range }).then(function (data) {
        vm.dataFound = true;
        vm.service = readableService(data);
        vm.version = data.Version;
      }, function (err) {

        vm.dataFound = false;
      });
    }

    function readableService(service) {
      if (!isNaN(service.Value.GreenPort) && !(service.Value.GreenPort === 0)) {
        service.Value.GreenPort = Number(service.Value.GreenPort);
      }
      if (!isNaN(service.Value.BluePort) && !(service.Value.BluePort === 0)) {
        service.Value.BluePort = Number(service.Value.BluePort);
      }
      return service;
    }

    function saveableService(service) {
      if (service.Value.GreenPort === null) {
        delete service.Value.GreenPort;
      }
      if (service.Value.BluePort === null) {
        delete service.Value.BluePort;
      }
      return service;
    }

    vm.canUser = function () {
      return userHasPermission;
    };

    vm.save = function () {
      var saveMethod;
      var url = '/api/v1/config/services';
      var data;
      if (vm.editMode) {
        data = saveableService(vm.service).Value;
        saveMethod = 'put';
        url += '/' + vm.service.ServiceName + '/' + vm.service.OwningCluster
      } else {
        data = saveableService(vm.service);
        saveMethod = 'post';
      }

      $http({
        method: saveMethod,
        url: url,
        data: data,
        headers: { 'expected-version': vm.version }
      }).then(function () {
        cachedResources.config.services.flush();
        navigateToList();
      });
    };

    function navigateToList() {
      $location.path(RETURN_PATH);
    }

    init();
  });
