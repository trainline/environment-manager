/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

/*
 * If currentDesiredTitle value has '/' it will add title
 * to the element that says "Current/Desired"
 */
angular.module('EnvironmentManager.environments')
  .directive('currentDesiredTitle', function ($parse) {
    return {
      restrict: 'A',
      scope: false,
      link: function (scope, elm, attrs) {
        attrs.$observe('currentDesiredTitle', function () {
          var val = attrs.currentDesiredTitle;
          if (typeof val === 'string' && val.indexOf('/') !== -1) {
            elm[0].setAttribute('title', 'Current/Desired');
          }
        });
      }
    };
  });

