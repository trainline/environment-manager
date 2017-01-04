/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.operations').controller('ASGSelectionModalController',
  function ($scope, $uibModal, $uibModalInstance, $q, parameters) {

    var vm = this;
    vm.asgs = _.uniq(parameters.asgs);

    vm.close = function () {
      $uibModalInstance.dismiss();
    };

    vm.selectASG = function (asg) {
      $uibModalInstance.close(asg);
    }

  });