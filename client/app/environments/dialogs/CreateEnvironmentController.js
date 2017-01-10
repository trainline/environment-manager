/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').controller('CreateEnvironmentController',
  function ($scope, $http, $uibModalInstance, $q, resources, cachedResources) {
    var vm = this;

    $scope.OwningClustersList = [];
    $scope.EnvironmentTypesList = [];
    $scope.DeploymentMapsList = [];
    $scope.EnvironmentNames = [];
    $scope.Environment = {};
    $scope.CloneExistingLB = false;
    $scope.CloneLBEnvironmentName = '';
    $scope.envNamePattern = '';

    var nameValidators = {};

    function init() {
      $scope.Environment = {
        Value: {
          SchemaVersion: 1,
        },
      };

      vm.alertSettingsList = resources.environmentAlertSettingsList;

      $scope.userHasPermission = user.hasPermission({ access: 'POST', resource: '/config/environments/*' });

      $q.all([
        $http.get('/api/v1/config/notification-settings').then(function (response) {

          vm.notificationSettingsList = _.map(response.data, 'NotificationSettingsId');
          console.log(vm.notificationSettingsList);
        }),

        cachedResources.config.clusters.all().then(function (clusters) {
          $scope.OwningClustersList = _.map(clusters, 'ClusterName').sort();
          $scope.Environment.Value.OwningCluster = $scope.OwningClustersList[0];
        }),

        cachedResources.config.environments.all().then(function (environments) {
          $scope.EnvironmentNames = _.map(environments, 'EnvironmentName').sort();
          $scope.CloneLBEnvironmentName = $scope.EnvironmentNames[0];
        }),

        cachedResources.config.environmentTypes.all().then(function (environmentTypes) {
          angular.forEach(environmentTypes, function mapEnvironmentTypes(type) {
            var typeName = type.EnvironmentType;
            var typeNamingPattern = type.Value.NamingPattern;
            if (typeNamingPattern !== undefined && typeNamingPattern !== '') {
              nameValidators[typeName] = typeNamingPattern
            }
            $scope.EnvironmentTypesList.push(typeName);
          });

          $scope.EnvironmentTypesList.sort();
          $scope.Environment.Value.EnvironmentType = $scope.EnvironmentTypesList[0];
          $scope.environmentTypeChange();
        }),

        cachedResources.config.deploymentMaps.all().then(function (deploymentMaps) {
          $scope.DeploymentMapsList = _.map(deploymentMaps, 'DeploymentMapName').sort();
          $scope.Environment.Value.DeploymentMap = $scope.DeploymentMapsList[0];
        }),
      ]);
    }

    $scope.environmentTypeChange = function () {
      var namingPattern = nameValidators[$scope.Environment.Value.EnvironmentType];
      if (namingPattern === undefined) {
        $scope.envNamePattern = '';
      } else {
        $scope.envNamePattern = new RegExp(namingPattern);
        $scope.patternText = namingPattern;
      }
    };

    $scope.canUser = function () {
      return $scope.userHasPermission;
    };

    $scope.Ok = function () {
      var params = {
        expectedVersion: 0,
        data: {
          EnvironmentName: $scope.Environment.EnvironmentName,
          Value: $scope.Environment.Value,
        },
      };

      resources.config.environments.post(params).then(function (data) {
        cachedResources.config.environments.flush();
        $uibModalInstance.close(data);
      });
    };

    $scope.Cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    init();
  });
