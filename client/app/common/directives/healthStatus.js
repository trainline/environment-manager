/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common')
  .directive('healthStatus', function ($parse) {
    return {
      restrict: 'E',
      scope: false,
      template: '<span class="health-status glyphicon"></span>',
      replace: true,
      link: function (scope, elm, attrs) {
        var statusMap = {
          Healthy: 'healthy',
          Error: 'error',
          Warning: 'warning',
          NoData: 'noData',
          Missing: 'error',
          passing: 'healthy',
          critical: 'error'
        };

        var classes = {
          warning: 'glyphicon-alert warning',
          healthy: 'glyphicon-ok-sign healthy',
          error: 'glyphicon-alert error',
          noData: 'glyphicon-question-sign no-data'
        };

        var status = $parse(attrs.status)(scope);
        var cls = classes[statusMap[status]];

        elm.addClass(cls);
      }
    };
  });
