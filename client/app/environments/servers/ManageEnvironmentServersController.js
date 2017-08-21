/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments')
  .controller('ManageEnvironmentServersController',
  function ($rootScope, $routeParams, $http, $q, cachedResources, resources, $uibModal, accountMappingService, serversView, QuerySync, environmentDeploy, $scope, serviceDiscovery) {
    var vm = this;

    var SHOW_ALL_OPTION = 'Any';

    var querySync = new QuerySync(vm, {
      environment: {
        property: 'selected.environment.EnvironmentName',
        default: $rootScope.WorkingEnvironment.EnvironmentName
      },
      status: {
        property: 'selected.status',
        default: SHOW_ALL_OPTION
      },
      cluster: {
        property: 'selected.cluster',
        default: SHOW_ALL_OPTION
      },
      server: {
        property: 'selected.serverRole',
        default: ''
      },
      service: {
        property: 'selected.serviceName',
        default: ''
      },
      asg_name: {
        property: 'openAsgName',
        default: null
      }
    });

    function init() {
      vm.dataLoading = true;
      vm.dataFound = false;

      vm.options = {
        statuses: [SHOW_ALL_OPTION, 'Healthy', 'Warning', 'Error'],
        clusters: [SHOW_ALL_OPTION]
      };

      vm.selected = {
        environment: {}
      };

      querySync.init();

      var environmentName = vm.selected.environment.EnvironmentName;
      $rootScope.WorkingEnvironment.EnvironmentName = environmentName;

      $q.all([

        cachedResources.config.clusters.all().then(function (clusters) {
          vm.options.clusters = vm.options.clusters.concat(_.map(clusters, 'ClusterName')).sort();
          vm.selected.cluster = vm.options.clusters[0];
        }),

        cachedResources.config.environments.all().then(function (envData) {
          vm.selected.environment = cachedResources.config.environments.getByName(environmentName, 'EnvironmentName', envData);
        }),

        accountMappingService.getAccountForEnvironment(vm.selected.environment.EnvironmentName).then(function (account) {
          vm.selected.account = account;
        })
      ]).then(function () {
        if (vm.openAsgName !== null) {
          vm.showInstanceDetails(vm.openAsgName);
        }

        vm.refresh();
      });
    }

    vm.refresh = function () {
      querySync.updateQuery();

      vm.dataLoading = true;
      var promise = $http({
        url: '/api/v1/environments/' + vm.selected.environment.EnvironmentName + '/servers'
      }).then(function (response) {
        var data = response.data;
        vm.data = data;
        vm.dataFound = data.Value && data.Value.length > 0;

        if (vm.dataFound) {
          vm.update()
            .then(function (data) {
              data.unhealthyRoles.map(function (role) {
                serviceDiscovery.getASGState(vm.selected.environment.EnvironmentName, role.asgName)
                  .then(function (state) {
                    //console.log(state)
                  })
              });
              data.healthyRoles.map(function (role) {
                serviceDiscovery.getASGState(vm.selected.environment.EnvironmentName, role.asgName)
                  .then(function (state) {
                    //console.log(state)
                  })
              });
            });
        }
      });
      promise.finally(function () {
        vm.dataLoading = false;
      });

      return promise;
    };

    vm.update = function () {
      querySync.updateQuery();
      vm.view = serversView(vm.data, vm.selected)
      return $q.resolve(vm.view);
    };

    vm.loadDeployDialog = function () {
      $uibModal.open({
        templateUrl: '/app/environments/dialogs/env-deploy-modal.html',
        controller: 'DeployModalController as vm',
        size: 'lg',
        resolve: {
          parameters: function () {
            return {
              Environment: vm.selected.environment
            };
          }
        }
      });
    };

    vm.showInstanceDetails = function (asgName, action) {
      vm.openAsgName = asgName;
      querySync.updateQuery();

      var modal = $uibModal.open({
        templateUrl: '/app/environments/dialogs/env-asg-details-modal.html',
        controller: 'ASGDetailsModalController as vm',
        windowClass: 'InstanceDetails',
        resolve: {
          parameters: function () {
            return {
              groupName: asgName,
              environment: vm.selected.environment,
              accountName: vm.selected.account,
              defaultAction: action
            };
          }
        }
      });

      modal.result.finally(function () {
        vm.openAsgName = null;
        querySync.updateQuery();
      });
    };

    environmentDeploy.registerDeployHandler(vm.loadDeployDialog);

    init();
  });

