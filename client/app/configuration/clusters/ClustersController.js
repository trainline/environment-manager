/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

// Manage all owning clusters
angular.module('EnvironmentManager.configuration').controller('ClustersController',
  function ($scope, $routeParams, $location, resources, cachedResources, modal) {
    $scope.Data = [];

    function init() {
      $scope.canPost = user.hasPermission({ access: 'POST', resource: '/config/clusters/*' });
      $scope.Refresh();
    }

    $scope.NewItem = function () {
      $location.path('/config/clusters/new');
    };

    $scope.Refresh = function () {
      $scope.dataLoading = true;
      resources.config.clusters.all().then(function (data) {
        $scope.Data = data;
        $scope.canDelete = false;
        for (var i in data) {
          var cluster = data[i];
          var canDelete = user.hasPermission({ access: 'DELETE', resource: '/config/clusters/' + cluster.ClusterName });
          if (canDelete) {
            $scope.canDelete = true;
            break;
          }
        }
        $scope.dataLoading = false;
      });
    };

    $scope.canUser = function (action) {
      if (action == 'post') return $scope.canPost;
      if (action == 'delete') return $scope.canDelete;
    };

    $scope.Delete = function (cluster) {
      var name = cluster.ClusterName;
      modal.confirmation({
        title: 'Delete Cluster',
        message: 'Are you sure you want to delete the <strong>' + name + '</strong> Cluster?',
        action: 'Delete',
        severity: 'Danger'
      }).then(function () {
        resources.config.clusters.delete({ key: name }).then($scope.Refresh);
        cachedResources.config.clusters.flush();
      });
    };

    $scope.ViewHistory = function (cluster) {
      $scope.ViewAuditHistory('Cluster', cluster.ClusterName);
    };

    init();
  });

