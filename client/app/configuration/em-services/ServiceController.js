/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

// Manage specific service
angular.module('EnvironmentManager.configuration').controller('ServiceController',
  function ($scope, $routeParams, $location, $q, resources, cachedResources, modal, $http, portservice) {
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
      }
    };
    vm.greenPortInUse = false;
    vm.bluePortInUse = false;
    vm.startingBluePort = null;
    vm.startingGreenPort = null;
    vm.portsValid = true;

    vm.cancel = navigateToList;

    function init() {
      var serviceName = $routeParams.service;
      var owningCluster = $routeParams.Range;
      vm.editMode = serviceName.toLowerCase() !== 'new';

      var access = vm.editMode ? 'PUT' : 'POST';
      var resource = vm.editMode ? serviceName + '/' + owningCluster : '*';
      userHasPermission = user.hasPermission({ access: access, resource: '/config/services/' + resource });

      $q.all([
        cachedResources.config.clusters.all().then(function (clusters) {
          vm.owningClustersList = _.map(clusters, 'ClusterName').sort();
        }),

        resources.config.services.all().then(function (services) {
          vm.serviceNames = _.map(services, 'ServiceName');
          vm.servicesList = vm.serviceNames.sort();
        })
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

    vm.checkPorts = function () {
      Promise.all([
        portservice.isPortInUse(vm.service.Value.GreenPort),
        portservice.isPortInUse(vm.service.Value.BluePort)])
        .then(function (results) {
          var greenResult = results[0] && vm.service.Value.GreenPort * 1 !== vm.startingGreenPort * 1;
          var blueResult = results[1] && vm.service.Value.BluePort * 1 !== vm.startingBluePort * 1;
          
          if (greenResult) {
            vm.greenPortInUse = true;
            vm.portsValid = false;
          } else {
            vm.greenPortInUse = false;
          }

          if (blueResult) {
            vm.bluePortInUse = true;
            vm.portsValid = false;
          } else {
            vm.bluePortInUse = false;
          }

          if (!blueResult && !greenResult) vm.portsValid = true;
        });
    };

    vm.getNextPortPair = function () {
      portservice.getNextSequentialPair()
        .then(function (pair) {
          vm.service.Value.GreenPort = pair.Green;
          vm.service.Value.BluePort = pair.Blue;
        });
    }

    var dependency = {
      Name: ''
    };

    vm.addDependency = function () {
      var newDep = angular.copy(dependency);
      try {
        vm.service.Value.Dependencies.push(newDep);
      } catch (e) {
        vm.service.Value.Dependencies = [];
        vm.service.Value.Dependencies.push(newDep);
      }
    }

    vm.removeDependency = function (index) {
      vm.service.Value.Dependencies.splice(index, 1);
    }

    var tag = {
      Key: '',
      Value: ''
    };

    vm.addTag = function () {
      var newTag = angular.copy(tag);
      try {
        vm.service.Value.Tags.push(newTag);
      } catch (e) {
        vm.service.Value.Tags = [];
        vm.service.Value.Tags.push(newTag);
      }
    }

    vm.removeTag = function (index) {
      vm.service.Value.Tags.splice(index, 1);
    }

    function readItem(name, range) {
      resources.config.services.get({ key: name, range: range }).then(function (data) {
        vm.dataFound = true;
        vm.service = readableService(data);
        vm.startingBluePort = vm.service.Value.BluePort;
        vm.startingGreenPort = vm.service.Value.GreenPort;
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

    vm.getOwningTeamEmail = function () {
      $http({
        method: 'get',
        url: '/api/v1/config/clusters/' + vm.service.OwningCluster,
        headers: { 'expected-version': $scope.Version }
      })
        .then(function (response) {
          try {
            if (!response.data.Value.GroupEmailAddress) throw void 0;

            vm.service.Value.PrimaryContact = response.data.Value.GroupEmailAddress;
          } catch (e) {
            console.log("[INFO] :: There is currently no email specified against this team.")
          }
        });

    }

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

