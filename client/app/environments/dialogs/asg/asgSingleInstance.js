/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments').component('asgSingleInstance', {
  templateUrl: '/app/environments/dialogs/asg/asgSingleInstance.html',
  bindings: {
    resolve: '<',
    close: '&',
    dismiss: '&'
  },
  controllerAs: 'vm',
  controller: function () {
    var vm = this;
    vm.dataLoading = false;
    vm.instance = vm.resolve.instance;
    vm.showLogLink = function (service) {
      return !_.includes(['Missing', 'Ignored'], service.DiffWithTargetState);
    };
  }
});
