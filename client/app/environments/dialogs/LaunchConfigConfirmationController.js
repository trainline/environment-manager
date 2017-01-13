/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments').controller('LaunchConfigConfirmationController',
  function ($scope, $uibModal, $uibModalInstance, $q, parameters) {
    var vm = this;
    vm.scalingExplanationLink = window.links.SCALING_EXPLANATION;

    var numInstances = parameters.asg.Instances.length;
    var numAZs = parameters.asg.AvailabilityZones.length;

    vm.numInstances = numInstances;
    vm.requiredInstancesForScalingRefresh = 2 * Math.ceil(numInstances / numAZs) * numAZs;

    vm.close = function () {
      $uibModalInstance.close({
        doScalingRefresh: false
      });
    };

    vm.doScalingRefresh = function () {
      $uibModalInstance.close({
        doScalingRefresh: true,
        numInstancesForRefresh: vm.requiredInstancesForScalingRefresh
      });
    };
  });
