/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').directive('uniqueAmong', function ($parse) {
  return {
    require: 'ngModel',
    link: function (scope, elm, attrs, ctrl) {
      var name = ctrl.$name;

      scope.$watch(attrs.ngModel, function (value) {
        if (attrs.disabled || attrs.readonly) return;
        // TODO: bug - the above properties are always undefined which means read-only controls are showing as invalid
        //       http://stackoverflow.com/questions/14019752/how-to-let-ng-disabled-directive-work-with-isolated-scope

        var list = $parse(attrs.uniqueAmong)(scope);

        // Compare case insensitive
        var dupeFound = false;
        for (var i = 0; i < list.length; i++) {
          if (angular.lowercase(list[i]) == angular.lowercase(value)) {
            dupeFound = true;
            break;
          }
        }

        if (!dupeFound) {
          delete scope.form[name].$error.duplicated;
          ctrl.$setValidity(name, true);
        } else {
          ctrl.$setValidity(name, false);
          scope.form[name].$error.duplicated = true;
        }
      });
    }
  };
});
