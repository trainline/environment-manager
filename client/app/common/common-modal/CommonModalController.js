/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').controller('CommonModalController',
  function ($scope, $uibModalInstance, $sce, configuration) {

    $scope.Title = configuration.title;
    $scope.Message = $sce.trustAsHtml(configuration.message);
    $scope.Action = configuration.action || 'Ok';
    $scope.Severity = (configuration.severity || 'Default').toLowerCase();
    $scope.Details = (configuration.details || []).map($sce.trustAsHtml);
    $scope.InfoMode = configuration.infomode || false;

    $scope.Ok = function () {
      $uibModalInstance.close();
    };

    $scope.Cancel = function () {
      $uibModalInstance.dismiss('cancel');
    };

  });
