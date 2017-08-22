/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments')
  .controller('ManageEnvironmentServersController',
  function ($rootScope, $routeParams, $http, $q, cachedResources, resources, $uibModal, accountMappingService, serversView, QuerySync, environmentDeploy, $scope, serviceDiscovery, enums) {
    var vm = this;

    var SHOW_ALL_OPTION = 'Any';
    vm.roleInformation = false;

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
      vm.roleInformation = false;
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
            .then(getInstanceStatusesFromLastHour)
            .then(addDeploymentStatus)
            .then(roleInformationFound);
        }
      });

      promise.finally(function () {
        vm.dataLoading = false;
      });

      return promise;
    };

    function getInstanceStatusesFromLastHour() {
      var dateRange = { name: 'Last hour', value: 1 * enums.MILLISECONDS.PerHour };
      var oneHourAgo = new Date((new Date().getTime() - dateRange.value)).toISOString();
      var params = {
        include_deployments_status: true,
        since: oneHourAgo
      };
      return $http.get('/api/v1/instances', { params: params });
    }

    function addDeploymentStatus(statuses) {
      let data = removeUnwantedStatuses(statuses);
      let roles = collectServerRoles(vm.view);

      return $q.all(roles.map(function (role) {
        let result = data.find(function (elem) {
          return elem['aws:autoscaling:groupName'] === role.asgName;
        });
        role.info = role.info || {};
        if (result) {
          role.info.deployments = true
          return result;
        } else {
          role.info.deployments = false
          return null;
        }
      }));
    }

    function removeUnwantedStatuses(statuses) {
      return statuses.data.filter(function (status) {
        let s = status.DeploymentStatus.toLowerCase();
        if (s !== 'failed' && s !== 'success') {
          return true;
        } else {
          return false;
        }
      });
    }

    function collectServerRoles(view) {
      return view.healthyRoles.concat(view.unhealthyRoles);
    }

    function roleInformationFound() {
      vm.roleInformation = true;
    }

    vm.update = function () {
      querySync.updateQuery();
      vm.view = serversView(vm.data, vm.selected)
      return $q.resolve();
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

