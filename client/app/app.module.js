/* TODO: enable linting and fix resulting errors */
/* eslint-disable */
/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

var app = angular.module('EnvironmentManager', [
  'ui.grid',
  'ngRoute',
  'angularMoment',
  'ngclipboard',
  'EnvironmentManager.common',
  'EnvironmentManager.environments',
  'EnvironmentManager.operations',
  'EnvironmentManager.configuration',
  'EnvironmentManager.compare',
  'EnvironmentManager.settings',
  'angular-loading-bar',
  'smart-table',
  'highcharts-ng'
]);

app.config(['cfpLoadingBarProvider', function (cfpLoadingBarProvider) {
  cfpLoadingBarProvider.includeSpinner = false;
}]);

// Setup global routes
app.config(function ($routeProvider, $compileProvider) {
  $compileProvider.preAssignBindingsEnabled(true);
  $routeProvider
    .when('/', {
      templateUrl: '/app/environments/summary/env-summary.html',
      controller: 'EnvironmentsSummaryController as vm',
      menusection: ''
    })
    .otherwise({
      redirectTo: '/'
    });
});

app.config(function ($httpProvider, $locationProvider, $qProvider) {
  $locationProvider.hashPrefix('');

  // Set default put request content type to JSON
  $httpProvider.defaults.headers.put['Content-Type'] = 'application/json;charset=utf-8';

  // Set up error pop up on HTTP errors
  $httpProvider.interceptors.push(function ($q, $rootScope, $log) {
    return {
      responseError: function (response) {
        if (response.status >= 400 && response.status !== 404) {
          // Filter out ETIMEDOUT dialogs from UI - load balancer data
          var errorMessage = _.get(response, 'data.error');
          if (errorMessage === 'Remote host: ETIMEDOUT') {
            $log.warn('Remote host: ETIMEDOUT');
          } else {
            $rootScope.$broadcast('error', response);
          }
        }
        return $q.reject(response);
      }
    };
  });
});

app.run(function ($rootScope, $timeout, $window) {
  $rootScope.canUser = function () {
    return true;
  };

  if ($window.user !== undefined) {
    $rootScope.loggedIn = true;
    $timeout(function () {
      $rootScope.$broadcast('cookie-expired');
    }, (window.user.getExpiration() - new Date().getTime()));
  }

  if ($window.remoteDebugger !== undefined) {
    $rootScope.showDebug = true;
    $rootScope.debugAddress = $window.remoteDebugger;
  }
});

