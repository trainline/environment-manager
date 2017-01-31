/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

// Manage specific service
angular.module('EnvironmentManager.configuration').controller('ServiceController',
  function ($scope, $routeParams, $location, $q, resources, cachedResources, modal, $http) {
    var vm = this;
    var RETURN_PATH = '/config/services';
    var userHasPermission;

    vm.service = {};
    vm.dataFound = false;
    vm.editMode = $routeParams.service !== 'new';
    vm.owningClustersList = [];
    vm.serviceNames = [];
    vm.version = 0;
    vm.ports = {
      range: {
        lower: 40000, 
        upper: 41000
      },
      blue: {
        existing: null,
        taken: false,
        current: null
      },
      green: {
        existing: null,
        taken: false,
        current: null
      }
    };

    vm.cancel = navigateToList;

    function init() {
      var serviceName = $routeParams.service;
      var owningCluster = $routeParams.Range;
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

        fetchPortNumbers()
      ]).then(function () {
        if (vm.editMode) {
          readItem(serviceName, owningCluster);
        } else {
          vm.service = {
            OwningCluster: vm.owningClustersList[0],
            Value: {
              SchemaVersion: 1
            }
          };
        }
      });
    }

    function fetchPortNumbers() {
      $http({
          method: 'GET',
          url: '/api/v1/config/services',
          headers: { 'expected-version': vm.version }
        }).then(function (result) {
          var ports = extractPortNumbers(result.data);
          vm.ports.blue.existing = ports.blue;
          vm.ports.green.existing = ports.green;
        }).then(function () {
          vm.getBluePort = findNewPort({range: vm.ports.range, ports: vm.ports.blue.existing});
          vm.getGreenPort = findNewPort({range: vm.ports.range, ports: vm.ports.green.existing});
        });
    }

    function extractPortNumbers(data) {
      var ports = {
        blue: [],
        green: []
      };
      _.map(data, function (item) {
        if (item.Value) {
          ports.green.push(item.Value.GreenPort * 1);
          ports.blue.push(item.Value.BluePort * 1);
        }
      });
      return ports;
    }

    function readItem(name, range) {
      resources.config.services.get({ key: name, range: range }).then(function (data) {
        vm.dataFound = true;
        vm.service = readableService(data);
        vm.ports.green.current = vm.service.Value.GreenPort;
        vm.ports.blue.current = vm.service.Value.BluePort;
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

    function findNewPort(config) {
      return function () {
        var newPort = 0;
        for(var i = config.range.lower; i <= config.range.upper; i += 1) {
          if(config.ports.indexOf(i) === -1) {
           newPort = i;
           break;
          }
        }
        return newPort;
      }
    }

    vm.checkBluePort = function() {
      if(vm.ports.blue.existing.indexOf(vm.service.Value.BluePort) !== -1 
          && vm.service.Value.BluePort !== vm.ports.blue.current) {
        vm.ports.blue.taken = true;
      } else {
        vm.ports.blue.taken = false;
      }
    }

    vm.checkGreenPort = function() {
      if(vm.ports.green.existing.indexOf(vm.service.Value.GreenPort) !== -1 
          && vm.service.Value.GreenPort !== vm.ports.green.current) {
        vm.ports.green.taken = true;
      } else {
        vm.ports.green.taken = false;
      }
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
        url += '/' + vm.service.ServiceName + '/' + vm.service.OwningCluster;
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

