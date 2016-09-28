/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.compare', [
  'ngRoute',
  'ui.bootstrap',
  'ui.select',
  'EnvironmentManager.common',
]);

angular.module('EnvironmentManager.compare').config(function ($routeProvider) {
  $routeProvider
    .when('/compare', {
      templateUrl: '/app/compare/compare.html',
      controller: 'CompareController as vm',
      menusection: '',
      reloadOnSearch: false,
    });
});
