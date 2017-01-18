/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.environments')
  .directive('healthChecks', function ($parse) {
    return {
      restrict: 'E',
      scope: false,
      template: '<span><span ng-repeat="check in healthChecks" ng-if="healthChecks.length > 0"><health-status status="check.Status"></health-status> {{ check.Name }}<br/></span>'
        + '<span ng-if="healthChecks.length === 0">-</span></span>',
      replace: true,
      link: function (scope, elm, attrs) {
        scope.healthChecks = $parse(attrs.list)(scope);
      }
    };
  });
