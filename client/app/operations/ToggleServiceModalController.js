/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('ToggleServiceModalController',
  function ($scope, $q, $http, $uibModalInstance, environmentName, resources, accountMappingService, cachedResources) {

    $scope.EnvironmentNames = [];
    $scope.ServiceNames = [];
    $scope.ToggledUpstreams = [];
    $scope.ErrorMessage = null;
    $scope.UpstreamChanged = false;

    $scope.EnvironmentName = environmentName;
    $scope.ServiceName = null;

    $scope.close = function () {
      $uibModalInstance.close($scope.UpstreamChanged);
    };

    $scope.toggle = function () {
      $scope.ToggledUpstreams = [];
      $scope.ErrorMessage = null;

      accountMappingService.getAccountForEnvironment($scope.EnvironmentName).then(function (awsAccount) {
        $http({
          method: 'put',
          url: '/api/v1/services/' + $scope.ServiceName + '/slices/toggle?environment=' + $scope.EnvironmentName,
          data: {}
        }).then(function (response) {
          $scope.ToggledUpstreams = response.data.ToggledUpstreams;
          $scope.UpstreamChanged = true;
        }, function (error) {
          $scope.ErrorMessage = error.data;
        })
      });
    };

    function init() {
      $q.all([
        cachedResources.config.environments.all(),
        cachedResources.config.services.all(),
      ]).then(function (results) {
        $scope.EnvironmentNames = _.map(results[0], 'EnvironmentName').sort();
        $scope.ServiceNames = _.map(results[1], 'ServiceName').sort();
      });
    };

    init();

  });
