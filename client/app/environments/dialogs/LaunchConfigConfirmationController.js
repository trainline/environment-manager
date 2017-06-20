/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments').controller('LaunchConfigConfirmationController',
  function ($scope, $uibModal, $uibModalInstance, $q, parameters) {
    // TODO: Replace with a formula that works with greater than 3 AZs
    function determineNumNewInstancesRequired(numInstances, numAZs) {
      var minInstances = numInstances * 2;

      if ((minInstances < numAZs) || (minInstances % numAZs === 0)) {
        return numInstances;
      }

      return numInstances + 1;
    }

    var vm = this;
    vm.scalingExplanationLink = window.links.SCALING_EXPLANATION;

    var numInstances = parameters.asg.Instances.length;
    var numAZs = parameters.asg.AvailabilityZones.length;
    var numNewInstancesRequired = determineNumNewInstancesRequired(numInstances, numAZs);

    vm.numAZs = numAZs;
    vm.numInstances = numInstances;
    vm.requiredInstancesForScalingRefresh = numInstances + numNewInstancesRequired;

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
