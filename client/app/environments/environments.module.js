/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments', [
  'ngRoute',
  'ui.bootstrap',
  'EnvironmentManager.common',
]);

angular.module('EnvironmentManager.environments').config(function ($routeProvider) {
  $routeProvider
    .when('/environments', {
      templateUrl: '/app/environments/summary/env-summary.html',
      controller: 'EnvironmentsSummaryController as vm',
      reloadOnSearch: false,
      menusection: '',
    })
    .when('/environment/schedule/', {
      templateUrl: '/app/environments/schedule/env-manage-schedule.html',
      controller: 'ManageEnvironmentScheduleController as vm',
      reloadOnSearch: false,
      menusection: 'EnvSchedule',
    })
    .when('/environment/settings/', {
      templateUrl: '/app/environments/settings/env-manage-settings.html',
      controller: 'ManageEnvironmentSettingsController as vm',
      reloadOnSearch: false,
      menusection: 'EnvSettings',
    })
    .when('/environment/servers/', {
      templateUrl: '/app/environments/servers/env-manage-servers.html',
      controller: 'ManageEnvironmentServersController as vm',
      reloadOnSearch: false,
      menusection: 'EnvServers',
    });
});
