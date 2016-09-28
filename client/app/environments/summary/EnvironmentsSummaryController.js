/* Copyright (c) Trainline Limited, 2016. All rights reserved. See LICENSE.txt in the project root for license information. */
'use strict';

angular.module('EnvironmentManager.environments').controller('EnvironmentsSummaryController',
  function ($scope, $routeParams, $location, $uibModal, $q, resources, cachedResources, configValidation, cron) {

    var SHOW_ALL_OPTION = 'Any';

    $scope.Data = [];

    $scope.OwningClustersList = [];
    $scope.EnvironmentTypesList = [];
    $scope.SelectedEnvironmentType = SHOW_ALL_OPTION;
    $scope.SelectedOwningCluster = SHOW_ALL_OPTION;

    $scope.EnvironmentConfigValid = {};

    $scope.DataLoading = false;

    $scope.gridOptions = {
      data: 'Data',
      columnDefs: [{
        name: 'statusIcon',
        displayName: '',
        field: 'EnvironmentName',
        cellClass: 'config-status',
        cellTemplate: '<div class="ui-grid-cell-contents" title="{{grid.appScope.EnvironmentConfigValid[row.entity.EnvironmentName].Error}}"><a href="#/environment/settings?environment={{row.entity.EnvironmentName}}&tab=validation"><div class="config-status-{{grid.appScope.EnvironmentConfigValid[row.entity.EnvironmentName].Valid}}"></div></a></div>',
      }, {
        name: 'environment',
        field: 'EnvironmentName',
        cellTemplate: '<a href="#/environment/settings?environment={{row.entity.EnvironmentName}}">{{row.entity.EnvironmentName}} <small ng-if="row.entity.Configuration.EnvironmentType">({{row.entity.Configuration.EnvironmentType}})</small></a>',
      }, {
        name: 'owningCluster',
        field: 'row.entity.Configuration.OwningCluster',
      }],
    };

    $scope.whatIsRow = function (grid, row) {
      console.log(row);
    };

    function init() {

      $scope.userHasPermission = user.hasPermission({ access: 'POST', resource: '/config/environments/*' });

      $q.all([
        cachedResources.config.clusters.all().then(function (clusters) {
          $scope.OwningClustersList = [SHOW_ALL_OPTION].concat(_.map(clusters, 'ClusterName')).sort();
        }),

        cachedResources.config.environmentTypes.all().then(function (environmentTypes) {
          $scope.EnvironmentTypesList = [SHOW_ALL_OPTION].concat(_.map(environmentTypes, 'EnvironmentType').sort());
        }),
      ]).then(function () {
        $scope.SelectedEnvironmentType = $routeParams.environmentType || SHOW_ALL_OPTION;
        $scope.SelectedOwningCluster = $routeParams.cluster || SHOW_ALL_OPTION;

        $scope.Refresh();
      });
    }

    $scope.Refresh = function () {
      $scope.DataLoading = true;
      $location.search({
        environmentType: $scope.SelectedEnvironmentType,
        cluster: $scope.SelectedOwningCluster,
      });

      var query = {};
      if ($scope.SelectedEnvironmentType != SHOW_ALL_OPTION) {
        query['Value.EnvironmentType'] = $scope.SelectedEnvironmentType;
      }

      if ($scope.SelectedOwningCluster != SHOW_ALL_OPTION) {
        query['Value.OwningCluster'] = $scope.SelectedOwningCluster;
      }

      $q.all([
        resources.config.environments.all({ query: query }),
        resources.ops.environments.all(),
      ]).then(function (results) {
        var configEnvironments = results[0];
        var opsEnvironments = results[1];

        $scope.Data = configEnvironments.merge(opsEnvironments,
          function (source, target) {
            return source.EnvironmentName === target.EnvironmentName;
          },

          function (source, target) {
            target = target || {};

            var result = {
              EnvironmentName: source.EnvironmentName,
              Configuration: source.Value,
              Operation: target.Value || {},
            };

            var scheduleAction = GetScheduleAction(result.Operation);
            result.Operation.getScheduleAction = function () {
              return scheduleAction; };

            return result;
          });

        $scope.DataLoading = false;
        setTimeout(ValidateEnvironments, 5000); // Don't call unless user is waiting on page to prevent excessive dynamo load
      });
    };

    $scope.canUser = function () {
      return $scope.userHasPermission;
    };

    $scope.ViewEnvironment = function (environment) {
      $location.path('/environments/' + environment.EnvironmentName);
    };

    $scope.NewEnvironment = function () {
      var instance = $uibModal.open({
        templateUrl: '/app/environments/dialogs/env-create-environment-modal.html',
        controller: 'CreateEnvironmentController',
      });
      instance.result.then(function () {
        $scope.Refresh();
      });
    };

    $scope.ViewDeployments = function (env) {
      $location.search('environment', env.EnvironmentName);
      $location.path('/operations/deployments/');
    };

    $scope.ViewHistory = function (environment) {
      $scope.ViewAuditHistory('Environment', environment.EnvironmentName);
    };

    function ValidateEnvironments() {
      $q.all([
        // Make sure cache populated to avoid async multiple hits
        cachedResources.config.environments.all(),
        cachedResources.config.services.all(),
        cachedResources.config.lbUpstream.all(),
        cachedResources.config.deploymentMaps.all(),
        cachedResources.config.lbSettings.all(),
      ]).then(function () {
        $scope.Data.forEach(function (env) { ValidateEnvironment(env); });
      });
    }

    function ValidateEnvironment(environment) {
      if (!$scope.EnvironmentConfigValid[environment.EnvironmentName]) {
        configValidation.ValidateEnvironment(environment.EnvironmentName).then(function (node) {
          $scope.EnvironmentConfigValid[environment.EnvironmentName] = node;
        });
      }
    }

    function GetScheduleAction(data) {
      function GetCurrentSchedule() {
        if (data.ScheduleAutomatically === false) {
          if (data.ManualScheduleUp === true) return '247';
          if (data.ManualScheduleUp === false) return 'OFF';
        }

        return data.DefaultSchedule;
      }

      var schedule = GetCurrentSchedule();
      return cron.getActionBySchedule(schedule);
    }

    init();
  });
