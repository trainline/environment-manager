/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common')
  .directive('lbStatusView', function () {
    return {
      restrict: 'E',
      scope: {
        servers: '='
      },
      templateUrl: '/app/common/directives/lbStatusView.html',
      controller: function ($scope, $rootScope, $attrs) {
        
      }
    };
  });