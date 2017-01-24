/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.common').directive('multipleEmails', function () {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      ctrl.$parsers.unshift(function (viewValue) {

        var emails = viewValue.split(',');
        emails = _.compact(emails);
        // loop that checks every email, returns undefined if one of them fails.
        var re = /\S+@\S+\.\S+/;

        var validityArr = emails.map(function(str){
            return re.test(str.trim());
        }); // sample return is [true, true, true, false, false, false]
        var atLeastOneInvalid = false;
        angular.forEach(validityArr, function(value) {
          if (value === false) {
            atLeastOneInvalid = true; 
          }
        }); 
        if (!atLeastOneInvalid) { 
          // ^ all I need is to call the angular email checker here, I think.
          ctrl.$setValidity('multipleEmails', true);
          return viewValue;
        } else {
          ctrl.$setValidity('multipleEmails', false);
          return undefined;
        }
      });
    }
  };
});
