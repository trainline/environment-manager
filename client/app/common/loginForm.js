/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common')
  .component('loginForm', {
    restrict: 'E',
    bindings: {
    },
    templateUrl: '/app/common/loginForm.html',
    controllerAs: 'vm',
    controller: function ($scope, $http, $route, $window) {
      var vm = this;
      vm.version = $window.version;

      vm.signIn = function () {
        $window.location = '/login';
      };
    }
  });
