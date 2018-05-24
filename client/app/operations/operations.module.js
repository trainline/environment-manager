/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.operations', [
  'ngRoute',
  'ui.bootstrap',
  'EnvironmentManager.common'
]);

angular.module('EnvironmentManager.operations').config(function ($routeProvider) {
  $routeProvider
    .when('/operations/upstreams', {
      templateUrl: '/app/operations/upstream/ops-upstream.html',
      controller: 'OpsUpstreamController as vm',
      reloadOnSearch: false,
      menusection: 'Upstreams'
    })
    .when('/operations/service', {
      templateUrl: '/app/operations/service/ops-service.html',
      controller: 'OpsServiceController as vm',
      reloadOnSearch: false,
      menusection: 'Service'
    })
    .when('/operations/maintenance/', {
      templateUrl: '/app/operations/maintenance/ops-maintenance.html',
      controller: 'OpsMaintenanceController as vm',
      menusection: 'Maintenance'
    })
    .when('/operations/deployments', {
      templateUrl: '/app/operations/deployments/ops-deployments.html',
      controller: 'OpsDeploymentsController as vm',
      reloadOnSearch: false,
      menusection: 'Deployments'
    })
    .when('/operations/amis', {
      templateUrl: '/app/operations/amis/ops-amis.html',
      controller: 'OpsAMIsController as vm',
      reloadOnSearch: false,
      menusection: 'AMIs'
    });
});
