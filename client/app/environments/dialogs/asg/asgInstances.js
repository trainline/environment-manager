/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').component('asgInstances', {
  templateUrl: '/app/environments/dialogs/asg/asgInstances.html',
  bindings: {
    asg: '<',
    asgState: '<',
  },
  controllerAs: 'vm',
  controller: function ($uibModal) {
    var vm = this;
    vm.dataLoading = false;
    vm.showRDC = vm.asg.Ami.Platform === 'Windows';

    _.each(vm.asgState.Instances, function (instance) {
      instance.enabledServicesCount = _.filter(instance.Services, { DiffWithTargetState: null }).length;
    });

    vm.showAsgSingleInstance = function (instance) {
      $uibModal.open({
        component: 'asgSingleInstance',
        size: 'lg',
        resolve: {
          instance: function () {
            return instance;
          },
        },
      });
    };
  }
});
