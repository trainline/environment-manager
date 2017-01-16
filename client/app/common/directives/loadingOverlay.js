/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common')
  .component('loadingOverlay', {
    restrict: 'E',
    bindings: {
    },
    template: '<div class="loading-overlay" ng-if="vm.visible"><spinner overlay="true"></spinner></div>',
    controllerAs: 'vm',
    controller: function (loading) {
      var vm = this;
      vm.visible = false;
      loading.registerLoadingOverlay(vm);
    }
  });



