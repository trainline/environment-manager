/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

var app = angular.module('EnvironmentManager.configuration').controller('AuditCompareModalController',
  function ($scope, $uibModalInstance, audit, arrayItemHashDetector) {
    $scope.Audit = audit;
    $scope.DiffOptions = arrayItemHashDetector;

    $scope.ok = function () {
      $uibModalInstance.dismiss('cancel');
    };
  });

