/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

// Manage all services
angular.module('EnvironmentManager.configuration').controller('ServicesController',
  function ($scope, $routeParams, $location, $http, resources, cachedResources, modal) {
    var SHOW_ALL_OPTION = 'Any';

    $scope.FullData = [];
    $scope.Data = [];
    $scope.OwningClustersList = [];
    $scope.SelectedOwningCluster = SHOW_ALL_OPTION;
    $scope.SelectedService = '';

    function init() {
      $scope.dataLoading = true;
      $scope.canPost = user.hasPermission({ access: 'POST', resource: '/config/services/**' });

      var cluster = $routeParams.cluster;
      var service = $routeParams.service;

      $scope.SelectedOwningCluster = cluster || SHOW_ALL_OPTION;
      $scope.SelectedService = service || '';

      cachedResources.config.clusters.all().then(function (clusters) {
        $scope.OwningClustersList = [SHOW_ALL_OPTION].concat(_.map(clusters, 'ClusterName')).sort();
      }).then(function () {
        $scope.Refresh();
      });
    }

    $scope.NewItem = function () {
      $location.path('/config/services/new');
    };

    $scope.Refresh = function () {
      var query = {};
      if ($scope.SelectedOwningCluster != SHOW_ALL_OPTION) {
        query.cluster = $scope.SelectedOwningCluster;
      }

      $http.get('/api/v1/config/services', { params: query }).then(function (response) {
        var data = response.data;
        $scope.FullData = data;
        $scope.UpdateFilter();
        $scope.canDelete = false;

        for (var i in $scope.Data) {
          var service = $scope.Data[i];
          var canDelete = user.hasPermission({ access: 'DELETE', resource: '/config/services/' + service.Name });
          if (canDelete) {
            $scope.canDelete = true;
            break;
          }
        }

        $scope.dataLoading = false;
      });
    };

    $scope.canUser = function (action) {
      if (action === 'post') return $scope.canPost;
      if (action === 'delete') return $scope.canDelete;
    };

    $scope.UpdateFilter = function () {
      $location.search('cluster', $scope.SelectedOwningCluster);
      $location.search('service', $scope.SelectedService || null);
      $scope.Data = $scope.FullData.filter(function (service) {
        return ($scope.SelectedService === '' || angular.lowercase(service.ServiceName).indexOf(angular.lowercase($scope.SelectedService)) != -1);
      });
    };

    $scope.Delete = function (service) {
      var serviceName = service.ServiceName;
      var owningCluster = service.OwningCluster;

      modal.confirmation({
        title: 'Deleting a Service',
        message: 'Are you sure you want to delete the <strong>' + serviceName + '</strong> service?',
        action: 'Delete',
        severity: 'Danger',
        details: ['NOTE: This will not delete the service from any Deployment Maps or Load Balancer Rules. It will also not clear any AWS resources associated with the service. Clean up of these needs to be done manually. Deleting services in Environment Manager before they are fully removed from AWS and Footplate is not a good idea! <strong>Please talk to the Server team if unsure</strong>.'] // TODO:
      }).then(function () {
        var params = { key: serviceName, range: owningCluster };
        resources.config.services.delete(params).then(function () {
          cachedResources.config.services.flush();
          $scope.Refresh();
        });
      });
    };

    $scope.ViewDeployments = function (service) {
      $location.search('servicename', service.ServiceName);
      $location.path('/operations/deployments/');
    };

    $scope.ViewHistory = function (service) {
      $scope.ViewAuditHistory('Service', service.ServiceName, service.OwningCluster);
    };

    init();
  });
