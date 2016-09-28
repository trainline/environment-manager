/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration').controller('DeploymentMapsController',
  function ($scope, $routeParams, $location, $uibModal, $q, modal, resources, cachedResources) {

    $scope.Data = [];

    function init() {
      $scope.dataLoading = true
      $scope.canPost = user.hasPermission({ access: 'POST', resource: '/config/deploymentmaps/*' });
      $scope.Refresh();
    }

    $scope.Refresh = function () {
      $scope.dataLoading = true;
      var environments = [];
      $q.all([
        resources.config.deploymentMaps.all().then(function (deploymentMaps) {
          $scope.Data = deploymentMaps.map(function (deploymentMap) {
            deploymentMap.UsedBy = [];
            return deploymentMap;
          });

          for (var i in deploymentMaps) {
            var deploymentMap = deploymentMaps[i];
            var canDelete = user.hasPermission({ access: 'DELETE', resource: '/config/deploymentmaps/' + deploymentMap.DeploymentMapName });
            if (canDelete) {
              $scope.canDelete = true;
              break;
            }
          };
        }),

        cachedResources.config.environments.all().then(function (envData) {
          environments = envData;
        }),
      ]).then(function addUsedByEnvironmentsInfo() {
        environments.forEach(function (env) {
          var map = getDeploymentMapByName(env.Value.DeploymentMap);
          if (map) {
            map.UsedBy.push(env.EnvironmentName);
          }
        });
        $scope.dataLoading = false;
      });
    };

    $scope.canUser = function (action) {
      if (action == 'post') return $scope.canPost;
      if (action == 'delete') return $scope.canDelete;
    };

    $scope.NewItem = function () {
      var instance = $uibModal.open({
        templateUrl: '/app/configuration/deployment-maps/deployment-maps-create-modal.html',
        controller: 'DeploymentMapCreateController',
      });
      instance.result.then(function () {
        $scope.Refresh();
      });
    };

    $scope.Delete = function (map) {
      var name = map.DeploymentMapName;
      modal.confirmation({
        title: 'Deleting a Deployment Map',
        message: 'Are you sure you want to delete the <strong>' + name + '</strong> Deployment Map?',
        action: 'Delete',
        severity: 'Danger',
      }).then(function () {
        resources.config.deploymentMaps.delete({ key: name }).then(function () {
          cachedResources.config.deploymentMaps.flush();
          $scope.Refresh();
        });
      });
    };

    $scope.Compare = function (map) {
      // TODO compare
    };

    $scope.ViewHistory = function (map) {
      $scope.ViewAuditHistory('Deployment Map', map.DeploymentMapName);
    };

    $scope.CountServices = function (map) {
      return Enumerable.From(map.Value.DeploymentTarget).Sum(function (target) {
        return target.Services.length;
      });
    };

    $scope.UsedBy = function (map) {
      var maxEnvironmentsToDisplay = 5;
      var displayUsedBy = angular.copy(map.UsedBy).sort();
      if (displayUsedBy.length > maxEnvironmentsToDisplay) {
        displayUsedBy.length = maxEnvironmentsToDisplay;
        displayUsedBy[displayUsedBy.length] = '...';
      }

      if (displayUsedBy.length == 0) {
        displayUsedBy.push('-');
      }

      return displayUsedBy.join(', ');
    };

    function getDeploymentMapByName(mapName) {
      for (var i = 0; i < $scope.Data.length; i++) {
        if ($scope.Data[i].DeploymentMapName == mapName) {
          return $scope.Data[i];
        }
      }
    }

    init();
  });
