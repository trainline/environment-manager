/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration').controller('DeploymentMapController',
  function ($scope, $routeParams, $location, $q, $uibModal, QuerySync, resources, cachedResources, modal, deploymentMapConverter, DeploymentMap) {
    var vm = this;

    var SHOW_ALL_OPTION = 'Any';
    var userHasPermission;

    vm.deploymentMap = {}; // The full deployment map being viewed/edited
    vm.deploymentTargets = []; // Active set of Deployment Targets

    vm.owningClustersList = [];
    vm.selectedOwningCluster = SHOW_ALL_OPTION;
    vm.serverRole = '';
    vm.serviceName = '';

    vm.dataFound = false;
    vm.dataLoading = true;

    var deploymentMapName = $routeParams.deploymentmap;

    var querySync = new QuerySync(vm, {
      cluster: {
        property: 'selectedOwningCluster',
        default: SHOW_ALL_OPTION
      },
      service: {
        property: 'serviceName',
        default: ''
      },
      server: {
        property: 'serverRole',
        default: ''
      },
      open_server: {
        property: 'openServerRoleName',
        default: null
      }
    });

    function init() {
      querySync.init();

      userHasPermission = user.hasPermission({ access: 'PUT', resource: '/config/deploymentmaps/' + deploymentMapName });

      $q.all([
        cachedResources.config.clusters.all().then(function (clusters) {
          vm.owningClustersList = [SHOW_ALL_OPTION].concat(_.map(clusters, 'ClusterName')).sort();
        })
      ]).then(function () {
        return readDeploymentMap(deploymentMapName);
      }).then(function () {
        if (vm.openServerRoleName !== null) {
          var target = _.find(vm.deploymentTargets, { ServerRoleName: vm.openServerRoleName });
          showTargetDialog(target, 'Edit');
        }
      });
    }

    vm.canUser = function () {
      return userHasPermission;
    };

    vm.search = function () {
      querySync.updateQuery();

      // Client side filter of Server Roles/targets based on user selections
      vm.deploymentTargets = vm.deploymentMap.Value.DeploymentTarget.filter(function (target) {
        var match = vm.selectedOwningCluster == SHOW_ALL_OPTION || target.OwningCluster == vm.selectedOwningCluster;

        if (match && vm.serverRole != '') {
          // Check for server role name match
          match = match && angular.lowercase(target.ServerRoleName).indexOf(angular.lowercase(vm.serverRole)) != -1;
        }

        if (match && vm.serviceName != '') {
          // Loop contained services and check for (partial) match
          var searchName = angular.lowercase(vm.serviceName);
          var matchingServiceFound = false;
          for (var i = 0; i < target.Services.length; i++) {
            var serviceName = angular.lowercase(target.Services[i].ServiceName);
            if (serviceName.indexOf(searchName) != -1) {
              matchingServiceFound = true;
              break;
            }
          }

          match = matchingServiceFound;
        }

        return match;
      });
    };

    vm.add = function () {
      var instance = showTargetDialog(null, 'New');
      instance.result.then(function () {
        readDeploymentMap(vm.deploymentMap.DeploymentMapName); // Refresh data to pick up changes
      });
    };

    vm.showEditDialog = function (target) {
      var instance = showTargetDialog(target, 'Edit');
      instance.result.then(function () {
        readDeploymentMap(vm.deploymentMap.DeploymentMapName); // Refresh data to pick up changes
      });
    };

    vm.clone = function (target) {
      var instance = showTargetDialog(target, 'Clone');
      instance.result.then(function () {
        readDeploymentMap(vm.deploymentMap.DeploymentMapName); // Refresh data to pick up changes
      });
    };

    vm.copyToAnotherDeploymentMap = function (target) {
      $uibModal.open({
        component: 'copyServerRole',
        resolve: {
          srcDeploymentMapName: function () {
            return vm.deploymentMap.DeploymentMapName;
          },
          serverRoleName: function () {
            return target.ServerRoleName;
          }
        }
      });
    };

    vm.delete = function (target) {
      var name = target.ServerRoleName;
      modal.confirmation({
        title: 'Deleting a Server Role',
        message: 'Are you sure you want to delete the <strong>' + name + '</strong> Server Role from this Deployment Map?',
        action: 'Delete',
        severity: 'Danger'
      }).then(function () {
        // Filter targets array to remove selected target
        vm.deploymentMap.Value.DeploymentTarget = vm.deploymentMap.Value.DeploymentTarget.filter(function (t) {
          // TODO: remove by server role and cluster, would like names to be unique across whole map but for now just per cluster
          return !(t.ServerRoleName == target.ServerRoleName && t.OwningCluster == target.OwningCluster);
        });

        // Convert back to Dynamo format for writing to the DB
        var deploymentMapValue = vm.deploymentMap.Value.DeploymentTarget.map(deploymentMapConverter.toDynamoSchema);

        var params = {
          key: vm.deploymentMap.DeploymentMapName,
          expectedVersion: vm.deploymentMap.Version,
          data: { DeploymentTarget: deploymentMapValue }
        };

        resources.config.deploymentMaps.put(params).then(function () {
          cachedResources.config.deploymentMaps.flush();
          readDeploymentMap(vm.deploymentMap.DeploymentMapName); // Refresh data to pick up changes
        });
      });
    };

    vm.viewHistory = function (target) {
      // TODO: Should be per target but only at deployment map level for now
      $scope.ViewAuditHistory('Deployment Map', vm.deploymentMap.DeploymentMapName);
    };

    function showTargetDialog(target, mode) {
      var instance = $uibModal.open({
        templateUrl: '/app/configuration/deployment-maps/deployment-maps-target-modal.html',
        controller: 'DeploymentMapTargetController as vm',
        size: 'lg',
        resolve: {
          deploymentMap: function () {
            return angular.copy(vm.deploymentMap);
          },

          deploymentTarget: function () {
            return angular.copy(target);
          },

          displayMode: function () {
            return mode;
          }
        }
      });

      if (target !== null) {
        vm.openServerRoleName = target.ServerRoleName;
        querySync.updateQuery();
      }

      instance.result.finally(function () {
        vm.openServerRoleName = null;
        querySync.updateQuery();
      });
      return instance;
    }

    function readDeploymentMap(mapName) {
      vm.dataLoading = true;
      return DeploymentMap.getByName(mapName).then(function (deploymentMap) {
        deploymentMap.Value.DeploymentTarget = deploymentMap.Value.DeploymentTarget.map(deploymentMapConverter.toDeploymentTarget);
        vm.deploymentMap = deploymentMap;
        vm.deploymentTargets = deploymentMap.Value.DeploymentTarget;

        // Clean away legacy service property.
        vm.deploymentTargets.forEach(function (dm) {
          dm.Services.forEach(function (s) {
            delete s.DeploymentMethod;
          });
        });

        vm.dataFound = true;
        vm.search();
      }, function () {
        vm.dataFound = false;
      }).finally(function () {
        vm.dataLoading = false;
      });
    }

    init();
  });
