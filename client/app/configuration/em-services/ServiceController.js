/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

// Manage specific service
angular.module('EnvironmentManager.configuration').controller('ServiceController',
  function ($scope, $routeParams, $location, $q, resources, cachedResources, modal) {

    var RETURN_PATH = '/config/services';

    $scope.Service = {};
    $scope.DataFound = false;
    $scope.EditMode = $routeParams['service'] !== 'new';
    $scope.OwningClustersList = [];
    $scope.ServiceNames = [];
    $scope.Version = 0;

    $scope.Cancel = navigateToList;

    function init() {

      var serviceName = $routeParams['service'];
      var owningCluster = $routeParams['Range'];
      $scope.EditMode = serviceName.toLowerCase() !== 'new';

      var access = $scope.EditMode ? 'PUT' : 'POST';
      var resource = $scope.EditMode ? name : '*';
      $scope.userHasPermission = user.hasPermission({ access: access, resource: '/config/services/' + resource });

      $q.all([
        cachedResources.config.clusters.all().then(function (clusters) {
          $scope.OwningClustersList = _.map(clusters, 'ClusterName').sort();
        }),

        resources.config.services.all().then(function (services) {
          $scope.ServiceNames = _.map(services, 'ServiceName');
        }),
      ]).then(function () {

        if ($scope.EditMode) {
          readItem(serviceName, owningCluster);
        } else {
          $scope.Service = {
            OwningCluster: $scope.OwningClustersList[0],
            Value: {
              SchemaVersion: 1
            },
          };
        }

      });
    }

    function readItem(name, range) {
      resources.config.services.get({ key: name, range: range }).then(function (data) {
        $scope.DataFound = true;
        $scope.Service = readableService(data);
        $scope.Version = data.Version;
      }, function (err) {

        $scope.DataFound = false;
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

    $scope.canUser = function () {
      return $scope.userHasPermission;
    };

    $scope.Save = function () {
      var saveMethod = $scope.EditMode ? resources.config.services.put : resources.config.services.post;
      var params = {
        key: $scope.Service.ServiceName,
        range: $scope.Service.OwningCluster,
        expectedVersion: $scope.Version,
        data: {
          Value: saveableService($scope.Service).Value,
        },
      };
      saveMethod(params).then(function () {
        cachedResources.config.services.flush();
        navigateToList();
      });
    };

    function navigateToList() {
      $location.path(RETURN_PATH);
    }

    init();
  });
