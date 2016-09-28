/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('OpsDeploymentsController',
  function ($scope, $routeParams, $uibModal, $q, resources, cachedResources, enums, QuerySync, Deployment) {
    var vm = this;

    var SHOW_ALL_OPTION = 'Any';

    vm.deployments = [];
    $scope.EnvironmentsList = [];
    $scope.OwningClustersList = [];
    $scope.StatusList = [];
    $scope.DataFound = false;
    $scope.DataLoading = false;
    $scope.selectedDeploymentId = null;

    var dateRangeList = vm.dateRangeList = [
      { name: 'Last hour', value: 1 * enums.MILLISECONDS.PerHour },
      { name: 'Today', value: 1 * enums.MILLISECONDS.PerDay },
      { name: 'Last 2 days', value: 2 * enums.MILLISECONDS.PerDay },
      { name: 'Last 3 days', value: 3 * enums.MILLISECONDS.PerDay },
      { name: 'Last 7 days', value: 7 * enums.MILLISECONDS.PerDay },
      { name: 'Last 30 days', value: 30 * enums.MILLISECONDS.PerDay },
      { name: 'Last 60 days', value: 60 * enums.MILLISECONDS.PerDay },
    ];

    var querySync = new QuerySync($scope, {
      date_range: {
        property: 'SelectedDateRangeValue',
        default: dateRangeList[0].value,
        castToInteger: true,
      },
      environment: {
        property: 'SelectedEnvironment',
        default: SHOW_ALL_OPTION,
      },
      status: {
        property: 'SelectedStatus',
        default: SHOW_ALL_OPTION,
      },
      cluster: {
        property: 'SelectedOwningCluster',
        default: SHOW_ALL_OPTION,
      },
      service: {
        property: 'ServiceName',
        default: null,
      },
      deployment_id: {
        property: 'selectedDeploymentId',
        default: null,
      },
      deployment_account: {
        property: 'selectedDeploymentAccount',
        default: null,
      },
    });

    function init() {
      querySync.init();

      if ($scope.selectedDeploymentId !== null) {
        Deployment.getById($scope.selectedDeploymentAccount, $scope.selectedDeploymentId).then(function (deployment) {
          vm.showDetails(deployment);
        });
      }

      $q.all([
        cachedResources.config.environments.all().then(function (environments) {
          $scope.EnvironmentsList = [SHOW_ALL_OPTION].concat(_.map(environments, 'EnvironmentName').sort());
        }),

        cachedResources.config.clusters.all().then(function (clusters) {
          $scope.OwningClustersList = [SHOW_ALL_OPTION].concat(_.map(clusters, 'ClusterName')).sort();
        }),

        resources.deployment.statuses.all().then(function (deploymentStatuses) {
          $scope.StatusList = [SHOW_ALL_OPTION].concat(deploymentStatuses);
        }),
      ]).then(function () {

        // Show default results
        vm.refresh();

      });
    }

    vm.refresh = function () {
      querySync.updateQuery();

      $scope.DataLoading = true;

      var query = {};

      if ($scope.SelectedEnvironment !== SHOW_ALL_OPTION) {
        query['Value.EnvironmentName'] = $scope.SelectedEnvironment;
      }

      if ($scope.SelectedStatus !== SHOW_ALL_OPTION) {
        query['Value.Status'] = $scope.SelectedStatus;
      }

      if ($scope.SelectedOwningCluster !== SHOW_ALL_OPTION) {
        query['Value.OwningCluster'] = $scope.SelectedOwningCluster;
      }

      if ($scope.SelectedDateRangeValue && $scope.SelectedDateRangeValue > 0) {
        var dateNow = new Date().getTime();
        dateNow -= ($scope.SelectedDateRangeValue);
        query['$date_from'] = new Date(dateNow).toISOString();
      }

      var params = {
        account: 'all', // Always retrieve deployments across all accounts
        query: query,
      };

      resources.deployments.all(params).then(function (data) {
        vm.deployments = data.map(Deployment.convertToListView);

        $scope.UniqueServices = _.uniq(data.map(function (d) { return d.Value.ServiceName; }));

        $scope.DataLoading = false;
        $scope.DataFound = true;
      });
    };

    $scope.foundServicesFilter = function (deployment) {
      if (!$scope.ServiceName) return true;
      querySync.updateQuery();
      if (!deployment.service.name) return false;
      return deployment.service.name.toLowerCase().indexOf($scope.ServiceName.toLowerCase()) >= 0;
    };

    vm.showDetails = function (deployment) {
      $scope.selectedDeploymentId = deployment.DeploymentID;
      $scope.selectedDeploymentAccount = deployment.AccountName;

      querySync.updateQuery();

      var modal = $uibModal.open({
        templateUrl: '/app/operations/deployments/ops-deployment-details-modal.html',
        windowClass: 'deployment-summary',
        controller: 'DeploymentDetailsModalController',
        size: 'lg',
        resolve: {
          deployment: function () {
            return deployment;
          },
        },
      });

      modal.result['finally'](function() {
        $scope.selectedDeploymentId = null;
        $scope.selectedDeploymentAccount = null;

        querySync.updateQuery();
      });
    };


    init();
  });
