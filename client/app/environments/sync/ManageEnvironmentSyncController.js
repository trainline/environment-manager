/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

(function () {
  angular
    .module('EnvironmentManager.environments')
    .controller('ManageEnvironmentSyncController', ManageEnvironmentSyncController);

  ManageEnvironmentSyncController.$inject = [

  ]

  function ManageEnvironmentSyncController() {
    var vm = this;
    
    vm.something = 'here is the something';
  }
})();
