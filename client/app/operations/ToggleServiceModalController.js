/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('ToggleServiceModalController',
  function ($scope, $q, $uibModalInstance, environmentName, resources, accountMappingService, cachedResources) {

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

      accountMappingService.GetAccountForEnvironment($scope.EnvironmentName).then(function (awsAccount) {
        resources.environment($scope.EnvironmentName)
          .inAWSAccount(awsAccount)
          .toggleSlices()
          .byService($scope.ServiceName)
          .do(function (result) {
            $scope.ToggledUpstreams = result.data.ToggledUpstreams;
            $scope.UpstreamChanged = true;
          }, function (error) {

            $scope.ErrorMessage = error.data;
          });
      });
    };

    function init() {

      function environmentName(environment) {
        return environment.EnvironmentName; }

      function serviceName(service) {
        return service.ServiceName; }

      $q.all([
        cachedResources.config.environments.all(),
        cachedResources.config.services.all(),
      ]).then(function (results) {
        $scope.EnvironmentNames = results[0].map(environmentName).sort();
        $scope.ServiceNames = results[1].map(serviceName).sort();
      });

    };

    init();

  });
