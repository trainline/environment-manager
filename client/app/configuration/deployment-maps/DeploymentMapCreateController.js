/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.configuration').controller('DeploymentMapCreateController',
  function ($scope, $uibModalInstance, resources, cachedResources) {

    $scope.DeploymentMaps = [];
    $scope.DeploymentMapNames = [];

    $scope.DeploymentMap;
    $scope.CloneExisting = false;
    $scope.DeploymentMapNameToClone = '';

    function init() {

      $scope.DeploymentMap = {
        DeploymentMapName: '',
        Value: {
          SchemaVersion: 1,
          DeploymentTarget: [],
        },
      };

      resources.config.deploymentMaps.all().then(function (deploymentMaps) {
        $scope.DeploymentMaps = deploymentMaps;
        $scope.DeploymentMapNames = _.map(deploymentMaps, 'DeploymentMapName').sort();
        $scope.DeploymentMapNameToClone = $scope.DeploymentMapNames[0];
      });

    }

    $scope.Ok = function () {

      var params = {
        key: $scope.DeploymentMap.DeploymentMapName,
        expectedVersion: 0,
        data: {
          Value: $scope.DeploymentMap.Value,
        },
      };

      if ($scope.CloneExisting) {
        var selectedDeploymentMap = GetDeploymentMapByName($scope.DeploymentMapNameToClone);
        if (selectedDeploymentMap) {
          params.data.Value.DeploymentTarget = angular.copy(selectedDeploymentMap.Value.DeploymentTarget);
        }
      }

      resources.config.deploymentMaps.post(params).then(function (data) {
        cachedResources.config.deploymentMaps.flush();
        $uibModalInstance.close(data);
      });
    };

    $scope.Cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    function GetDeploymentMapByName(name) {
      var matchingMap = null;
      $scope.DeploymentMaps.forEach(function (map) {
        if (map.DeploymentMapName == name) {
          matchingMap = map;
        }
      });

      return matchingMap;
    }

    init();
  });
