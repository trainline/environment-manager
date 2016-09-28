/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').component('asgSingleInstance', {
  templateUrl: '/app/environments/dialogs/asg/asgSingleInstance.html',
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&'
  },
  controllerAs: 'vm',
  controller: function (roles, Deployment, serviceDiscovery) {
    var vm = this;

    vm.dataLoading = false;

    var asg = vm.resolve.asg;
    vm.instance = vm.resolve.instance;
  }
});
