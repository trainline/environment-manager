/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.common').directive('validJson', function () {
  return {
    require: 'ngModel',
    restrict: 'A',
    link: function (scope, elm, attrs, ctrl) {
      var formFieldName = ctrl.$name;
      var validationMethodName = attrs.validJson;
      var validationMethod = null;

      if (validationMethodName) {
        var validationMethod = scope[validationMethodName];
        if (!validationMethod) throw 'Expected to find a method called \'' + validationMethodName + '\' in the controller';
      }

      var verifyJson = function (jsonString) {
        if (attrs.disabled || attrs.readonly) return;

        var validationError = null;

        if (jsonString) {
          try {
            var json = JSON.parse(jsonString);

            if (validationMethod) {
              var result = validationMethod(json);
              validationError = result;
            }
          } catch (ex) { validationError = ['Invalid Json']; }
        }

        if (validationError) {
          scope.form[formFieldName].$error.invalid = validationError;
          ctrl.$setValidity(formFieldName, false);
        } else {
          delete scope.form[formFieldName].$error.invalid;
          ctrl.$setValidity(formFieldName, true);
        }
      };

      scope.$watch(attrs.ngModel, verifyJson);
    }
  };
});

