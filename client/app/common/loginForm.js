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
        if (vm.username === undefined || vm.password === undefined) {
          return;
        }

        $http.post('/api/v1/login', {
          username: vm.username,
          password: vm.password
        }).then(function () {
          $window.location.reload();
        }).catch(function (err) {
          vm.error = { message: err.data.originalException };
        });
      };
    }
  });
