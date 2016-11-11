/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('OpsDeploymentsController',
  function ($routeParams, $uibModal, $scope, $q, $timeout, resources, cachedResources, enums, QuerySync, Deployment) {
    var vm = this;

    var SHOW_ALL_OPTION = 'Any';

    vm.deployments = [];
    vm.environmentsList = [];
    vm.owningClustersList = [];
    vm.statusList = [];
    vm.selectedDeploymentId = null;

    var dateRangeList = vm.dateRangeList = [
      { name: 'Last hour', value: 1 * enums.MILLISECONDS.PerHour },
      { name: 'Today', value: 1 * enums.MILLISECONDS.PerDay },
      { name: 'Last 2 days', value: 2 * enums.MILLISECONDS.PerDay },
      { name: 'Last 3 days', value: 3 * enums.MILLISECONDS.PerDay },
      { name: 'Last 7 days', value: 7 * enums.MILLISECONDS.PerDay },
      { name: 'Last 30 days', value: 30 * enums.MILLISECONDS.PerDay },
      { name: 'Last 60 days', value: 60 * enums.MILLISECONDS.PerDay },
    ];

    var querySync = new QuerySync(vm, {
      date_range: {
        property: 'selectedDateRangeValue',
        default: dateRangeList[0].value,
        castToInteger: true,
      },
      environment: {
        property: 'selectedEnvironment',
        default: SHOW_ALL_OPTION,
      },
      status: {
        property: 'selectedStatus',
        default: SHOW_ALL_OPTION,
      },
      cluster: {
        property: 'selectedOwningCluster',
        default: SHOW_ALL_OPTION,
      },
      service: {
        property: 'serviceName',
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

      if (vm.selectedDeploymentId !== null) {
        Deployment.getById(vm.selectedDeploymentAccount, vm.selectedDeploymentId).then(function (deployment) {
          vm.showDetails(deployment);
        });
      }

      $q.all([
        cachedResources.config.environments.all().then(function (environments) {
          vm.environmentsList = [SHOW_ALL_OPTION].concat(_.map(environments, 'EnvironmentName').sort());
        }),

        cachedResources.config.clusters.all().then(function (clusters) {
          vm.owningClustersList = [SHOW_ALL_OPTION].concat(_.map(clusters, 'ClusterName')).sort();
        }),

        resources.deployment.statuses.all().then(function (deploymentStatuses) {
          vm.statusList = [SHOW_ALL_OPTION].concat(deploymentStatuses);
        }),
      ]).then(function () {
        // Show default results
        vm.refresh();
      });
    }

    vm.refresh = function () {
      querySync.updateQuery();
      var query = {};

      if (vm.selectedEnvironment !== SHOW_ALL_OPTION) {
        query.environment = vm.selectedEnvironment;
      }

      if (vm.selectedStatus !== SHOW_ALL_OPTION) {
        query.status = vm.selectedStatus;
      }

      if (vm.selectedOwningCluster !== SHOW_ALL_OPTION) {
        query.cluster = vm.selectedOwningCluster;
      }

      if (vm.selectedDateRangeValue && vm.selectedDateRangeValue > 0) {
        var dateNow = new Date().getTime();
        dateNow -= (vm.selectedDateRangeValue);
        query.since = new Date(dateNow).toISOString();
      }

      vm.query = query;

      $timeout(function () {
        $scope.$broadcast('refresh');
      });
    };

    vm.foundServicesFilter = function (deployment) {
      if (!vm.serviceName) return true;
      querySync.updateQuery();
      if (!deployment.service.name) return false;
      return deployment.service.name.toLowerCase().indexOf(vm.serviceName.toLowerCase()) >= 0;
    };

    init();
  });
