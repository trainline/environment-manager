/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration').controller('DeploymentMapController',
  function ($scope, $routeParams, $location, $q, $uibModal, QuerySync, resources, cachedResources, modal, deploymentMapConverter, DeploymentMap, localstorageservice) {
    var vm = this;

    var SHOW_ALL_OPTION = 'Any';
    var userHasPermission;

    vm.deploymentMap = {}; 
    vm.deploymentTargets = [];

    vm.owningClustersList = [];
    vm.allDeploymentMaps = [];
    vm.selectedOwningCluster = SHOW_ALL_OPTION;
    vm.serverRole = '';
    vm.serviceName = '';

    vm.dataFound = false;
    vm.dataLoading = true;

    var deploymentMapName = $routeParams.deploymentmap;
    vm.deploymentMapToRedictTo = deploymentMapName;

    var querySync = new QuerySync(vm, {
      cluster: {
        property: 'selectedOwningCluster',
        default: localstorageservice.getValueOrDefault('em-selections-team', SHOW_ALL_OPTION)
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
      localstorageservice.set('em-selections-team', vm.selectedOwningCluster);
      vm.deploymentTargets = vm.deploymentMap.Value.DeploymentTarget.filter(function (target) {
        var match = vm.selectedOwningCluster == SHOW_ALL_OPTION || target.OwningCluster == vm.selectedOwningCluster;

        if (match && vm.serverRole != '') {
          match = match && angular.lowercase(target.ServerRoleName).indexOf(angular.lowercase(vm.serverRole)) != -1;
        }

        if (match && vm.serviceName != '') {
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
        readDeploymentMap(vm.deploymentMap.DeploymentMapName);
      });
    };

    vm.showEditDialog = function (target) {
      var instance = showTargetDialog(target, 'Edit');
      instance.result.then(function () {
        readDeploymentMap(vm.deploymentMap.DeploymentMapName); 
      });
    };

    vm.clone = function (target) {
      var instance = showTargetDialog(target, 'Clone');
      instance.result.then(function () {
        readDeploymentMap(vm.deploymentMap.DeploymentMapName);
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
        vm.deploymentMap.Value.DeploymentTarget = vm.deploymentMap.Value.DeploymentTarget.filter(function (t) {
          return !(t.ServerRoleName == target.ServerRoleName && t.OwningCluster == target.OwningCluster);
        });

        var deploymentMapValue = vm.deploymentMap.Value.DeploymentTarget.map(deploymentMapConverter.toDynamoSchema);

        var params = {
          key: vm.deploymentMap.DeploymentMapName,
          expectedVersion: vm.deploymentMap.Version,
          data: { DeploymentTarget: deploymentMapValue }
        };

        resources.config.deploymentMaps.put(params).then(function () {
          cachedResources.config.deploymentMaps.flush();
          readDeploymentMap(vm.deploymentMap.DeploymentMapName);
        });
      });
    };

    vm.viewHistory = function (target) {
      $scope.ViewAuditHistory('Deployment Map', vm.deploymentMap.DeploymentMapName);
    };

    vm.redirectToDeploymentMap = function () {
      var url = "/config/deploymentmaps/" + vm.deploymentMapToRedictTo;
      $location.path(url);
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
      DeploymentMap.getAll().then(function (deploymentMaps) {
        vm.allDeploymentMaps = deploymentMaps;
      });
      return DeploymentMap.getByName(mapName).then(function (deploymentMap) {
        deploymentMap.Value.DeploymentTarget = deploymentMap.Value.DeploymentTarget.map(deploymentMapConverter.toDeploymentTarget);
        vm.deploymentMap = deploymentMap;
        vm.deploymentTargets = deploymentMap.Value.DeploymentTarget;

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
