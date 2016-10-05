/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments')
  .controller('ManageEnvironmentServersController',
    function ($scope, $rootScope, $routeParams, $q, cachedResources, resources, $uibModal, accountMappingService, serversView, QuerySync) {
      var vm = this;

      var SHOW_ALL_OPTION = 'Any';

      var querySync = new QuerySync($scope, {
        environment: {
          property: 'selected.environment.EnvironmentName',
          default: $rootScope.WorkingEnvironment.EnvironmentName,
        },
        status: {
          property: 'selected.status',
          default: SHOW_ALL_OPTION,
        },
        cluster: {
          property: 'selected.cluster',
          default: SHOW_ALL_OPTION,
        },
        server: {
          property: 'selected.serverRole',
          default: '',
        },
        service: {
          property: 'selected.serviceName',
          default: '',
        },
        asg_name: {
          property: 'openAsgName',
          default: null,
        },
      });

      function init() {
        $scope.DataLoading = true;
        $scope.DataFound = false;

        $scope.options = {
          statuses: [SHOW_ALL_OPTION, 'Healthy', 'Warning', 'Error'],
          clusters: [SHOW_ALL_OPTION],
        };

        $scope.selected = {
          environment: {},
        };

        querySync.init();

        var environmentName = $scope.selected.environment.EnvironmentName;
        $rootScope.WorkingEnvironment.EnvironmentName = environmentName;

        $q.all([

          cachedResources.config.clusters.all().then(function (clusters) {
            $scope.options.clusters = $scope.options.clusters.concat(_.map(clusters, 'ClusterName')).sort();
            $scope.selected.cluster = $scope.options.clusters[0];
          }),

          cachedResources.config.environments.all().then(function (envData) {
            $scope.selected.environment = cachedResources.config.environments.getByName(environmentName, 'EnvironmentName', envData);
          }),

          accountMappingService.GetAccountForEnvironment($scope.selected.environment.EnvironmentName).then(function (account) {
            $scope.selected.account = account;
          }),
        ]).then(function() {

          if ($scope.openAsgName !== null) {
            vm.showInstanceDetails($scope.openAsgName);
          }

          $scope.Refresh();
        });
      }

      $scope.Refresh = function () {
        querySync.updateQuery();

        $scope.DataLoading = true;
        var promise = resources.servers.all($scope.selected).then(function (data) {
          $scope.data = data;
          $scope.DataFound = data.Value && data.Value.length > 0;

          if ($scope.DataFound) {
            vm.update();            
          }
        });
        promise['finally'](function() {
          $scope.DataLoading = false;
        });

        return promise;
      };

      vm.update = function () {
        querySync.updateQuery();

        $scope.view = serversView($scope.data, $scope.selected);
      };

      vm.loadDeployDialog = function () {
        $uibModal.open({
          templateUrl: '/app/environments/dialogs/env-deploy-modal.html',
          controller: 'DeployModalController as vm',
          size: 'lg',
          resolve: {
            parameters: function () {
              return {
                Environment: $scope.selected.environment,
              };
            },
          },
        });
      };

      vm.showInstanceDetails = function (asgName, action) {
        $scope.openAsgName = asgName;
        querySync.updateQuery();

        var modal = $uibModal.open({
          templateUrl: '/app/environments/dialogs/env-asg-details-modal.html',
          controller: 'ASGDetailsModalController as vm',
          windowClass: 'InstanceDetails',
          resolve: {
            parameters: function () {
              return {
                groupName: asgName,
                environment: $scope.selected.environment,
                accountName: $scope.selected.account,
                defaultAction: action,
              };
            },
          },
        });

        modal.result['finally'](function() {
          $scope.openAsgName = null;
          querySync.updateQuery();
        });
      };

      init();
    });
