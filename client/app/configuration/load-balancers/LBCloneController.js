/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

var app = angular.module('EnvironmentManager.configuration').controller('LBCloneController',
  function ($scope, $uibModalInstance, resources, cachedResources, modal, lbBulkOperationService, sourceEnv) {

    $scope.EnvironmentsList = [];
    $scope.CloneOptions = {
      SourceEnvironment: '',
      TargetEnvironment: '',
    };

    function init() {

      cachedResources.config.environments.all().then(function (environments) {
        $scope.EnvironmentsList = _.map(environments, 'EnvironmentName').sort();
        $scope.CloneOptions.TargetEnvironment = $scope.EnvironmentsList[0];
      });

      $scope.CloneOptions.SourceEnvironment = sourceEnv;
    }

    $scope.Ok = function () {
      modal.confirmation({
        title: 'Clone Load Balancer Settings',
        message: 'Are you sure you want to delete the Load Balancer settings from <strong>' + $scope.CloneOptions.TargetEnvironment + '</strong> and replace them with a copy from <strong>' + $scope.CloneOptions.SourceEnvironment + '</strong>?',
        action: 'Clone Settings',
        severity: 'Danger',
      }).then(function () {
        lbBulkOperationService.CloneLBSettings($scope.CloneOptions.SourceEnvironment, $scope.CloneOptions.TargetEnvironment);
      });
    };

    $scope.Cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

    init();
  });
