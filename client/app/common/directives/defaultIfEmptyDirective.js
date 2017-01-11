/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').directive('defaultIfEmpty', function () {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {
      var defaultValue = attrs['defaultIfEmpty'] || null;

      ctrl.$parsers.unshift(function(viewValue) {
        var result = viewValue !== '' ? viewValue : defaultValue
        return result;
      });
    }
  }
});
