/* Copyright (c) Trainline Limited, 2016-2017. All rights reserved. See LICENSE.txt in the project root for license information. */

'use strict';

angular.module('EnvironmentManager.configuration', [
  'ngRoute',
  'ui.ace',
  'ui.bootstrap',
  'ui.tree',
  'ngFileSaver',
  'EnvironmentManager.common'
]);

angular.module('EnvironmentManager.configuration').config(function ($routeProvider) {
  $routeProvider
    .when('/config/accounts/', {
      templateUrl: '/app/configuration/accounts/accounts.html',
      controller: 'AccountsController as vm',
      controllerAs: 'accounts',
      menusection: 'Accounts'
    })
    .when('/config/accounts/:accountName', {
      templateUrl: '/app/configuration/accounts/account.html',
      controller: 'AccountController as vm',
      controllerAs: 'account',
      menusection: 'Accounts'
    })
    .when('/config/environmenttypes/', {
      templateUrl: '/app/configuration/environment-types/environment-types.html',
      controller: 'EnvironmentTypesController as vm',
      menusection: 'EnvironmentTypes'
    })
    .when('/config/environmenttypes/:environmenttype/', {
      templateUrl: '/app/configuration/environment-types/environment-type.html',
      controller: 'EnvironmentTypeController as vm',
      menusection: 'EnvironmentTypes'
    })
    .when('/config/services/', {
      templateUrl: '/app/configuration/em-services/services.html',
      controller: 'ServicesController as vm',
      reloadOnSearch: false,
      menusection: 'Services'
    })
    .when('/config/services/:service/', {
      templateUrl: '/app/configuration/em-services/service.html',
      controller: 'ServiceController as vm',
      menusection: 'Services'
    })
    .when('/config/deploymentmaps/', {
      templateUrl: '/app/configuration/deployment-maps/deployment-maps.html',
      controller: 'DeploymentMapsController as vm',
      menusection: 'DeploymentMaps'
    })
    .when('/config/deploymentmaps/:deploymentmap/', {
      templateUrl: '/app/configuration/deployment-maps/deployment-map.html',
      controller: 'DeploymentMapController as vm',
      reloadOnSearch: false,
      menusection: 'DeploymentMaps'
    })
    .when('/config/loadbalancers/', {
      templateUrl: '/app/configuration/load-balancers/loadbalancers.html',
      controller: 'LBsController as vm',
      reloadOnSearch: false,
      menusection: 'LBs'
    })
    .when('/config/loadbalancer/', {
      templateUrl: '/app/configuration/load-balancers/loadbalancer.html',
      controller: 'LBController as vm',
      menusection: 'LBs'
    })
    .when('/config/upstreams/', {
      templateUrl: '/app/configuration/lbupstreams/lbupstreams.html',
      controller: 'LBUpstreamsController as vm',
      reloadOnSearch: false,
      menusection: 'LBUpstream'
    })
    .when('/config/upstream/', {
      templateUrl: '/app/configuration/lbupstreams/lbupstream.html',
      controller: 'LBUpstreamController as vm',
      menusection: 'LBUpstream'
    })
    .when('/config/import/', {
      templateUrl: '/app/configuration/import/import.html',
      controller: 'ImportController as vm',
      menusection: 'Import'
    })
    .when('/config/export/', {
      templateUrl: '/app/configuration/export/export.html',
      controller: 'ExportController as vm',
      menusection: 'Export'
    })
    .when('/config/audit/', {
      templateUrl: '/app/configuration/audit/audit.html',
      controller: 'AuditController as vm',
      menusection: 'Audit'
    })
    .when('/config/permissions/', {
      templateUrl: '/app/configuration/permissions/permissions.html',
      controller: 'PermissionsController as vm',
      menusection: 'Permissions'
    })
    .when('/config/permissions/:member/', {
      templateUrl: '/app/configuration/permissions/permission.html',
      controller: 'PermissionController as vm',
      menusection: 'Permissions'
    })
    .when('/config/notification-settings/', {
      template: '<notification-settings-list></notification-settings-list>',
    })
    .when('/config/notification-settings/:id', {
      template: '<notification-settings-entry></notification-settings-entry>',
    })

    .when('/config/clusters/', {
      templateUrl: '/app/configuration/clusters/clusters.html',
      controller: 'ClustersController as vm',
      menusection: 'Clusters'
    })
    .when('/config/clusters/:cluster/', {
      templateUrl: '/app/configuration/clusters/cluster.html',
      controller: 'ClusterController as vm',
      menusection: 'Clusters'
    });
});
